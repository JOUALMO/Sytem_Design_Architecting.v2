import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent } from 'react'
import { Activity, ArrowLeftRight, ArrowRight, ArrowUpRight, Boxes, Check, ChevronDown, ChevronRight, CircleHelp, Command, Download, FileCode2, FolderTree, GitBranch, Layers2, Link2, MoreHorizontal, Network, PanelRightClose, PanelRightOpen, Plus, Search, Settings2, Sparkles, Workflow, X, Undo2, Redo2, Trash2, Upload, type LucideIcon } from 'lucide-react'
import { activeScenario, clone, elementKinds, makeProject, makeStarterProject, relationshipKinds, uid, validateProjectBundle, validateWorkspace, type ArchitectureFinding, type ArchitectureModel, type Element, type FindingStatus, type Flow, type PlanningDecision, type Project, type ProjectBundle, type Relationship, type RepositorySnapshot, type Workspace } from './domain'
import { loadWorkspace, saveWorkspace } from './persistence'
import { advanceSimulation, createSimulation, simulationDiff, type SimulationPreset, type SimulationState } from './simulation'
import type { AnalysisRequest, AnalysisResponse, AnalysisSummary } from './importer/types'

type View = 'canvas' | 'repository' | 'findings' | 'flows' | 'plan' | 'import-review'
type Modal = 'element' | 'flow' | 'relationship' | 'project' | 'scenario' | 'import' | 'repository' | null
interface PendingRepositoryImport { model: ArchitectureModel; snapshot: RepositorySnapshot; summary: AnalysisSummary }
interface ImportProgress { phase: string; completed: number; total: number; rootName: string }

function applyRepositoryModel(current: ArchitectureModel, previousBaseline: ArchitectureModel, incoming: ArchitectureModel, additions: boolean, updates: boolean, removeMissing: boolean) {
  const beforeElements = new Map(previousBaseline.elements.filter((element) => element.source).map((element) => [element.id, element]))
  const beforeRelationships = new Map(previousBaseline.relationships.filter((edge) => edge.source).map((edge) => [edge.id, edge]))
  const incomingElementIds = new Set(incoming.elements.map((element) => element.id))
  const incomingRelationshipIds = new Set(incoming.relationships.map((edge) => edge.id))
  const currentElements = new Map(current.elements.map((element) => [element.id, element]))
  const currentRelationships = new Map(current.relationships.map((edge) => [edge.id, edge]))
  const conflicts: string[] = []

  for (const next of incoming.elements) {
    const existing = currentElements.get(next.id)
    if (!existing) { if (additions) currentElements.set(next.id, clone(next)); continue }
    if (!updates) continue
    const before = beforeElements.get(next.id)
    const unchanged = before && existing.kind === before.kind && existing.name === before.name && existing.description === before.description && existing.path === before.path && existing.status === before.status && JSON.stringify(existing.tags) === JSON.stringify(before.tags)
    if (unchanged) currentElements.set(next.id, { ...clone(next), x: existing.x, y: existing.y })
    else if (before) conflicts.push(next.name)
  }
  for (const next of incoming.relationships) {
    const existing = currentRelationships.get(next.id)
    if (!existing) { if (additions) currentRelationships.set(next.id, clone(next)); continue }
    if (!updates) continue
    const before = beforeRelationships.get(next.id)
    const unchanged = before && existing.fromId === before.fromId && existing.toId === before.toId && existing.kind === before.kind && existing.label === before.label && existing.status === before.status
    if (unchanged) currentRelationships.set(next.id, clone(next))
    else if (before) conflicts.push(`${existing.label || existing.kind} relationship`)
  }

  const staleIds = new Set([...beforeElements.keys()].filter((id) => !incomingElementIds.has(id)))
  if (removeMissing) for (const id of staleIds) currentElements.delete(id)
  const removed = removeMissing ? staleIds : new Set<string>()
  const elements = [...currentElements.values()]
  const presentIds = new Set(elements.map((element) => element.id))
  const relationships = [...currentRelationships.values()].filter((edge) => presentIds.has(edge.fromId) && presentIds.has(edge.toId) && (!removeMissing || incomingRelationshipIds.has(edge.id) || !edge.source))
  const flows = current.flows.map((flow) => ({ ...flow, steps: flow.steps.map((step) => removed.has(step.elementId ?? '') ? { ...step, elementId: undefined } : step) }))
  return { model: { elements, relationships, flows }, conflicts: [...new Set(conflicts)], staleCount: staleIds.size }
}

function mergeRepositoryBaseline(existing: ArchitectureModel, incoming: ArchitectureModel): ArchitectureModel {
  const manualElements = existing.elements.filter((element) => !element.source)
  const elements = [...manualElements, ...clone(incoming.elements)]
  const ids = new Set(elements.map((element) => element.id))
  const manualRelationships = existing.relationships.filter((edge) => !edge.source)
  const relationships = [...manualRelationships, ...clone(incoming.relationships)].filter((edge) => ids.has(edge.fromId) && ids.has(edge.toId))
  const flows = existing.flows.map((flow) => ({ ...flow, steps: flow.steps.map((step) => step.elementId && !ids.has(step.elementId) ? { ...step, elementId: undefined } : step) }))
  return { elements, relationships, flows }
}

const kindLabel = (kind: string) => kind.replaceAll('-', ' ')
const kindIcon = (kind: string): LucideIcon => ({ application: Boxes, package: Boxes, 'bounded-context': Layers2, folder: FolderTree, file: FileCode2, module: Boxes, function: Settings2, 'api-endpoint': ArrowLeftRight, database: Layers2, cache: Activity, queue: Workflow, 'browser-storage': Layers2, worker: Activity, 'external-system': ArrowUpRight, service: Network }[kind] ?? Boxes)

function generatedValidationCases(model: ArchitectureModel) {
  const cases: string[] = []
  for (const flow of model.flows) {
    for (const step of flow.steps) {
      if (step.next.length > 1) for (const nextId of step.next) {
        const branch = flow.steps.find((item) => item.id === nextId)
        cases.push(`${flow.name}: ${step.title} → ${branch?.branchLabel || branch?.title || 'modeled branch'}`)
      }
      if (step.action === 'read-cache') {
        cases.push(`${flow.name}: cache hit returns the cached value without a database read`)
        cases.push(`${flow.name}: cache miss follows the modeled fallback branch`)
        cases.push(`${flow.name}: cache unavailability follows a modeled fallback or failure path`)
      }
      if (step.action === 'read-database') cases.push(`${flow.name}: database failure or offline state follows a modeled failure path`)
      if (step.action === 'write-database') cases.push(`${flow.name}: offline write is queued and becomes durable only after synchronization`)
      if (step.action === 'sync-queue') cases.push(`${flow.name}: failed synchronization retains queued operations for retry`)
      if (step.action === 'invalidate-cache') cases.push(`${flow.name}: successful write invalidates the matching cache key`)
    }
    if (!flow.steps.some((step) => step.next.length > 1 || step.action && step.action !== 'note')) cases.push(`${flow.name}: traverse the primary path from “${flow.trigger}” and verify each modeled outcome`)
  }
  return [...new Set(cases)]
}

function generatedRolloutSteps(project: Project, model: ArchitectureModel) {
  const steps = ['Confirm open decisions and assumptions with the owning team before implementation.', 'Run generated flow-path checks and capture expected cache, database, and offline-queue state.', 'Deploy the change behind a reversible flag or staged rollout where the stack supports it.', 'Monitor request failures, cache hit/miss ratio, database writes, and pending offline queue depth.', 'Rollback by disabling the new path, preserving the authoritative database, and reconciling queued writes before retry.']
  if (model.elements.some((element) => element.kind === 'database' && element.status === 'proposed')) steps.splice(2, 0, 'Apply and verify the proposed data migration with a tested backup and rollback path.')
  if (project.repository?.findings?.some((finding) => finding.status === 'open' && finding.severity === 'high')) steps.splice(1, 0, 'Resolve or explicitly accept high-severity repository findings before rollout.')
  return steps
}

function compareModels(left: ArchitectureModel, right: ArchitectureModel) {
  const changes: { type: string; status: 'added' | 'removed' | 'changed'; name: string; detail: string }[] = []
  const leftElements = new Map(left.elements.map((item) => [item.id, item]))
  const rightElements = new Map(right.elements.map((item) => [item.id, item]))
  for (const element of left.elements) {
    const before = rightElements.get(element.id)
    if (!before) changes.push({ type: 'Element', status: 'added', name: element.name, detail: `${kindLabel(element.kind)}${element.path ? ` · ${element.path}` : ''}` })
    else {
      const fields = ['kind', 'name', 'description', 'path', 'status'] as const
      const changed = fields.filter((key) => element[key] !== before[key])
      if (JSON.stringify([...element.tags].sort()) !== JSON.stringify([...before.tags].sort())) changed.push('tags' as typeof fields[number])
      if (changed.length) changes.push({ type: 'Element', status: 'changed', name: element.name, detail: `Changed ${changed.join(', ')}` })
    }
  }
  for (const element of right.elements) if (!leftElements.has(element.id)) changes.push({ type: 'Element', status: 'removed', name: element.name, detail: `${kindLabel(element.kind)}${element.path ? ` · ${element.path}` : ''}` })
  const leftEdges = new Map(left.relationships.map((item) => [item.id, item]))
  const rightEdges = new Map(right.relationships.map((item) => [item.id, item]))
  const nameMap = new Map([...left.elements, ...right.elements].map((item) => [item.id, item.name]))
  for (const edge of left.relationships) {
    const before = rightEdges.get(edge.id)
    const label = `${nameMap.get(edge.fromId) ?? 'Unknown'} ${edge.kind} ${nameMap.get(edge.toId) ?? 'Unknown'}`
    if (!before) changes.push({ type: 'Relationship', status: 'added', name: label, detail: edge.label })
    else if ([edge.fromId, edge.toId, edge.kind, edge.label, edge.status].some((key, index) => key !== [before.fromId, before.toId, before.kind, before.label, before.status][index])) changes.push({ type: 'Relationship', status: 'changed', name: label, detail: 'Endpoint, kind, label, or status changed' })
  }
  for (const edge of right.relationships) if (!leftEdges.has(edge.id)) changes.push({ type: 'Relationship', status: 'removed', name: `${nameMap.get(edge.fromId) ?? 'Unknown'} ${edge.kind} ${nameMap.get(edge.toId) ?? 'Unknown'}`, detail: edge.label })
  const leftFlows = new Map(left.flows.map((item) => [item.id, item]))
  const rightFlows = new Map(right.flows.map((item) => [item.id, item]))
  const flowShape = (flow: Flow) => JSON.stringify({ name: flow.name, trigger: flow.trigger, entryStepId: flow.entryStepId, steps: flow.steps.map((step) => ({ ...step, next: [...step.next].sort() })) })
  for (const flow of left.flows) {
    const before = rightFlows.get(flow.id)
    if (!before) changes.push({ type: 'Flow', status: 'added', name: flow.name, detail: `${flow.steps.length} steps` })
    else if (flowShape(flow) !== flowShape(before)) changes.push({ type: 'Flow', status: 'changed', name: flow.name, detail: 'Trigger, steps, actions, branches, or linked elements changed' })
  }
  for (const flow of right.flows) if (!leftFlows.has(flow.id)) changes.push({ type: 'Flow', status: 'removed', name: flow.name, detail: `${flow.steps.length} steps` })
  return changes
}

function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const workspaceRef = useRef<Workspace | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [saveState, setSaveState] = useState<'loading' | 'saved' | 'saving' | 'error'>('loading')
  const [view, setView] = useState<View>('canvas')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [toast, setToast] = useState('')
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [pendingImport, setPendingImport] = useState<PendingRepositoryImport | null>(null)
  const [applyAdditions, setApplyAdditions] = useState(true)
  const [applyUpdates, setApplyUpdates] = useState(true)
  const [removeDeleted, setRemoveDeleted] = useState(false)
  const [history, setHistory] = useState<{ past: Workspace[]; future: Workspace[] }>({ past: [], future: [] })
  const importRef = useRef<HTMLInputElement>(null)
  const repositoryInputRef = useRef<HTMLInputElement>(null)
  const analysisWorkerRef = useRef<Worker | null>(null)
  const importRunRef = useRef<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    loadWorkspace().then((loaded) => {
      if (!alive) return
      const initial: Workspace = loaded ?? { schemaVersion: 1, projects: [makeStarterProject()], activeProjectId: '', theme: 'dark' }
      if (!initial.activeProjectId || !initial.projects.some((project) => project.id === initial.activeProjectId)) initial.activeProjectId = initial.projects[0]?.id ?? ''
      workspaceRef.current = initial
      setWorkspace(initial)
      setHydrated(true)
      setSaveState(loaded ? 'saved' : 'saving')
    }).catch(() => {
      if (!alive) return
      const project = makeStarterProject()
      const initialWorkspace = { schemaVersion: 1 as const, projects: [project], activeProjectId: project.id, theme: 'dark' as const }
      workspaceRef.current = initialWorkspace
      setWorkspace(initialWorkspace)
      setHydrated(true)
      setSaveState('error')
    })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!hydrated || !workspace) return
    const timer = window.setTimeout(() => {
      setSaveState('saving')
      saveWorkspace(workspace).then(() => setSaveState('saved')).catch(() => setSaveState('error'))
    }, 450)
    return () => window.clearTimeout(timer)
  }, [workspace, hydrated])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const project = workspace?.projects.find((item) => item.id === workspace.activeProjectId) ?? workspace?.projects[0]
  const scenario = project ? activeScenario(project) : undefined
  const model = scenario?.model
  const elementsById = useMemo(() => new Map((model?.elements ?? []).map((element) => [element.id, element])), [model?.elements])
  const relationshipIndex = useMemo(() => {
    const index = new Map<string, Relationship[]>()
    for (const edge of model?.relationships ?? []) {
      for (const id of [edge.fromId, edge.toId]) {
        const values = index.get(id) ?? []
        values.push(edge)
        index.set(id, values)
      }
    }
    return index
  }, [model?.relationships])
  const selected = selectedId ? elementsById.get(selectedId) ?? null : null
  const selectedFlow = model?.flows[0]
  const indexedSelectedRelationships = selectedId ? relationshipIndex.get(selectedId) ?? [] : []
  const selectedRelationshipCount = indexedSelectedRelationships.length
  const selectedRelationships = indexedSelectedRelationships.slice(0, 100)

  const commit = useCallback((update: (current: Workspace) => Workspace) => {
    const current = workspaceRef.current
    if (!current) return
    const before = clone(current)
    const next = update(clone(current))
    workspaceRef.current = next
    setHistory((state) => ({ past: [...state.past.slice(-79), before], future: [] }))
    setWorkspace(next)
  }, [])

  const updateModel = useCallback((update: (current: ArchitectureModel) => ArchitectureModel) => {
    commit((current) => {
      const activeProject = current.projects.find((item) => item.id === current.activeProjectId)
      if (!activeProject) return current
      const active = activeScenario(activeProject)
      active.model = update(active.model)
      activeProject.updatedAt = new Date().toISOString()
      return current
    })
  }, [commit])

  const undo = useCallback(() => {
    const current = workspaceRef.current
    if (!history.past.length || !current) return
    const previous = history.past[history.past.length - 1]
    workspaceRef.current = clone(previous)
    setWorkspace(workspaceRef.current)
    setHistory((state) => ({ past: state.past.slice(0, -1), future: [clone(current), ...state.future] }))
  }, [history.past])

  const redo = useCallback(() => {
    const current = workspaceRef.current
    if (!history.future.length || !current) return
    const next = history.future[0]
    workspaceRef.current = clone(next)
    setWorkspace(workspaceRef.current)
    setHistory((state) => ({ past: [...state.past, clone(current)], future: state.future.slice(1) }))
  }, [history.future])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen((open) => !open); setCommandQuery('') }
      else if (mod && event.key.toLowerCase() === 'z' && !event.shiftKey) { event.preventDefault(); undo() }
      else if (mod && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) { event.preventDefault(); redo() }
      else if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) { event.preventDefault(); setSearchOpen(true); window.setTimeout(() => document.getElementById('global-search')?.focus(), 0) }
      else if (event.key === 'Escape') { setModal(null); setCommandOpen(false); setSearchOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  useEffect(() => {
    if (view !== 'canvas' || !selectedId || !canvasRef.current) return
    const element = model?.elements.find((item) => item.id === selectedId)
    if (element) canvasRef.current.scrollTo({ left: Math.max(0, element.x - 120), top: Math.max(0, element.y - 110), behavior: 'smooth' })
  }, [selectedId, view, project?.id])

  const mutateProject = (fn: (current: Project) => void) => commit((current) => {
    const activeProject = current.projects.find((item) => item.id === current.activeProjectId)
    if (activeProject) { fn(activeProject); activeProject.updatedAt = new Date().toISOString() }
    return current
  })

  const addElement = (values: Pick<Element, 'name' | 'kind' | 'description' | 'path'>) => {
    const element: Element = { ...values, id: uid(), status: 'proposed', tags: [], x: 100 + Math.random() * 480, y: 100 + Math.random() * 310 }
    updateModel((current) => ({ ...current, elements: [...current.elements, element] }))
    setSelectedId(element.id); setModal(null); setView('canvas')
  }

  const addRelationship = (fromId: string, toId: string, kind: Relationship['kind'], label: string) => {
    updateModel((current) => ({ ...current, relationships: [...current.relationships, { id: uid(), fromId, toId, kind, label, status: 'proposed' }] }))
    setModal(null); setToast('Relationship added to scenario')
  }

  const addFlow = (name: string) => {
    const firstId = uid()
    const flow: Flow = { id: uid(), name, trigger: 'User action', entryStepId: firstId, steps: [{ id: firstId, title: 'Start flow', detail: 'Describe the first behavior in this flow.', next: [] }] }
    updateModel((current) => ({ ...current, flows: [...current.flows, flow] }))
    setModal(null); setView('flows'); setToast('Flow created')
  }

  const createScenario = (name: string, description: string) => {
    mutateProject((current) => {
      const next = { id: uid(), name, description, createdAt: new Date().toISOString(), model: clone(activeScenario(current).model) }
      current.scenarios.push(next); current.activeScenarioId = next.id
    })
    setModal(null); setToast('Scenario branched from the current model')
  }

  const captureBaseline = () => {
    mutateProject((current) => {
      const modelToFreeze = clone(activeScenario(current).model)
      modelToFreeze.elements = modelToFreeze.elements.map((element) => ({ ...element, status: element.status === 'proposed' ? 'declared' : element.status }))
      modelToFreeze.relationships = modelToFreeze.relationships.map((edge) => ({ ...edge, status: edge.status === 'proposed' ? 'declared' : edge.status }))
      if (current.baseline.elements.length || current.repository) current.baselineHistory = [...(current.baselineHistory ?? []), { id: uid(), name: `Baseline before ${new Date().toLocaleDateString()}`, capturedAt: new Date().toISOString(), model: clone(current.baseline), repository: current.repository ? clone(current.repository) : undefined }].slice(-3)
      current.baseline = modelToFreeze
      activeScenario(current).model = clone(modelToFreeze)
    })
    setToast('Baseline captured from the active scenario')
  }

  const createProject = (name: string) => {
    const next = makeProject(name)
    commit((current) => { current.projects.push(next); current.activeProjectId = next.id; return current })
    setSelectedId(null); setModal(null); setToast('New project created')
  }

  const createProjectAndImport = (name: string) => { createProject(name); setModal('repository') }

  const switchScenario = (id: string) => mutateProject((current) => { current.activeScenarioId = id })

  const updateElement = (id: string, patch: Partial<Element>) => updateModel((current) => ({ ...current, elements: current.elements.map((item) => item.id === id ? { ...item, ...patch } : item) }))

  const removeElement = (id: string) => {
    updateModel((current) => ({ ...current, elements: current.elements.filter((item) => item.id !== id), relationships: current.relationships.filter((edge) => edge.fromId !== id && edge.toId !== id), flows: current.flows.map((flow) => ({ ...flow, steps: flow.steps.map((step) => step.elementId === id ? { ...step, elementId: undefined } : step) })) }))
    setSelectedId(null); setToast('Element removed from this scenario')
  }

  const addStep = (flowId: string) => {
    const id = uid()
    updateModel((current) => ({ ...current, flows: current.flows.map((flow) => {
      if (flow.id !== flowId) return flow
      const last = flow.steps[flow.steps.length - 1]
      return { ...flow, steps: [...flow.steps.map((step) => step.id === last?.id ? { ...step, next: [...step.next, id] } : step), { id, title: 'New step', detail: 'Describe what happens here.', next: [] }] }
    }) }))
  }

  const updateFlowStep = (flowId: string, stepId: string, patch: Partial<Flow['steps'][number]>) => updateModel((current) => ({ ...current, flows: current.flows.map((flow) => flow.id === flowId ? { ...flow, steps: flow.steps.map((step) => step.id === stepId ? { ...step, ...patch } : step) } : flow) }))
  const updateFlow = (flowId: string, patch: Partial<Flow>) => updateModel((current) => ({ ...current, flows: current.flows.map((flow) => flow.id === flowId ? { ...flow, ...patch } : flow) }))

  const addPlanningDecision = (values: Pick<PlanningDecision, 'kind' | 'title' | 'detail'>) => mutateProject((current) => {
    current.decisions = [...(current.decisions ?? []), { ...values, id: uid(), status: 'open', scenarioId: current.activeScenarioId, createdAt: new Date().toISOString() }]
  })
  const updatePlanningDecision = (id: string, patch: Partial<PlanningDecision>) => mutateProject((current) => {
    current.decisions = (current.decisions ?? []).map((item) => item.id === id ? { ...item, ...patch } : item)
  })
  const removePlanningDecision = (id: string) => mutateProject((current) => { current.decisions = (current.decisions ?? []).filter((item) => item.id !== id) })

  const exportPlan = () => {
    if (!project || !scenario || !model) return
    const namesById = new Map(model.elements.map((element) => [element.id, element.name]))
    const proposed = model.elements.filter((element) => element.status === 'proposed')
    const evidence = [...model.elements.flatMap((element) => element.source ? [{ name: element.name, source: element.source }] : []), ...model.relationships.flatMap((edge) => edge.source ? [{ name: `${edge.kind}: ${edge.label || edge.id}`, source: edge.source }] : [])]
    const findings = project.repository?.findings ?? []
    const decisions = project.decisions ?? []
    const validationCases = generatedValidationCases(model)
    const rolloutSteps = generatedRolloutSteps(project, model)
    const markdown = `# Change plan: ${scenario.name}

## Goal
${scenario.description || 'Describe the outcome this scenario should achieve.'}

## Baseline and scope
- Project: ${project.name}
- Scenario: ${scenario.name}
- Generated: ${new Date().toLocaleString()}
- Repository: ${project.repository ? `locally analyzed from ${project.repository.rootName} on ${project.repository.importedAt}` : 'No repository source has been imported.'}
- Analyzer: ${project.repository?.analyzerVersion ?? 'manual model only'}
- Source fingerprint: ${project.repository?.fingerprint ?? 'not available'}
- Provenance counts: ${model.elements.filter((element) => element.status === 'observed').length} observed, ${model.elements.filter((element) => element.status === 'inferred').length} inferred, ${model.elements.filter((element) => element.status === 'declared').length} declared, ${model.elements.filter((element) => element.status === 'proposed').length} proposed.

## Proposed architecture
${proposed.length ? proposed.map((element) => `- **${element.name}** (${kindLabel(element.kind)})${element.path ? ` — \`${element.path}\`` : ''}: ${element.description || 'No description provided.'}`).join('\n') : '- No elements are marked as proposed.'}

## Relationships
${model.relationships.length ? model.relationships.map((edge) => `- ${namesById.get(edge.fromId) ?? 'Unknown'} **${edge.kind}** ${namesById.get(edge.toId) ?? 'Unknown'}${edge.label ? ` — ${edge.label}` : ''} [${edge.status}]${edge.source ? ` (${edge.source.path}:${edge.source.startLine ?? 1})` : ''}`).join('\n') : '- No relationships have been modeled.'}

## Flows
${model.flows.length ? model.flows.map((flow) => `### ${flow.name}
Trigger: ${flow.trigger}

${flow.steps.map((step, index) => `${index + 1}. **${step.title}**${step.elementId ? ` — ${namesById.get(step.elementId) ?? 'Unlinked element'}` : ''}: ${step.detail}`).join('\n')}`).join('\n\n') : 'No flows have been modeled.'}

## Source evidence
${evidence.length ? evidence.slice(0, 500).map(({ name, source }) => `- **${name}** — \`${source.path}${source.startLine ? `:${source.startLine}` : ''}\` · ${source.analyzer}/${source.rule}: ${source.summary}`).join('\n') : 'No source evidence is attached to this model.'}
${project.repository?.warnings.length ? `\nAnalysis notes: ${project.repository.warnings.length} warnings are stored with the repository snapshot. Review them in the local repository view.` : ''}

## Stack review findings
${findings.length ? findings.map((finding) => `- **[${finding.status}; ${finding.severity}] ${finding.title}** (${finding.confidence} confidence) — ${finding.description} Review: ${finding.recommendation}${finding.evidence[0] ? ` Evidence: \`${finding.evidence[0].path}:${finding.evidence[0].startLine ?? 1}\`.` : ''}`).join('\n') : 'No stack findings are stored for this repository snapshot.'}

## Decisions and open questions
${decisions.length ? decisions.map((item) => `- **${item.kind} · ${item.status}: ${item.title}** — ${item.detail || 'No detail recorded.'}${item.scenarioId ? ` (scenario: ${project.scenarios.find((candidate) => candidate.id === item.scenarioId)?.name ?? 'unknown'})` : ''}`).join('\n') : '- No project decisions or assumptions have been recorded yet.'}

## Generated validation cases
${validationCases.length ? validationCases.map((item) => `- [ ] ${item}`).join('\n') : '- Add flows and modeled actions to generate scenario-specific validation cases.'}

## Suggested rollout and rollback
${rolloutSteps.map((item, index) => `${index + 1}. ${item}`).join('\n')}

## Validation matrix
| Case | Expected behavior | Test / evidence needed |
| --- | --- | --- |
${validationCases.length ? validationCases.map((item) => `| ${item.replaceAll('|', '\\|')} | Confirm from the modeled state transition | Add or run an implementation test |`).join('\n') : '| Primary success path | Confirm from the flow model | Add an implementation test |\n| Dependency failure | Define fallback or failure behavior | Add a failure-path test |'}
`
    download(`${slug(scenario.name)}-change-plan.md`, markdown, 'text/markdown')
    setToast('Markdown change plan exported')
  }

  const exportBundle = () => {
    if (!workspace) return
    download('architecture-lab-projects.json', JSON.stringify(workspace, null, 2), 'application/json')
    setToast('Local workspace bundle exported')
  }

  const exportProjectBundle = () => {
    if (!project) return
    const bundle: ProjectBundle = { format: 'architecture-lab-project', formatVersion: 1, exportedAt: new Date().toISOString(), project: clone(project) }
    download(`${slug(project.name)}-architecture-lab.json`, JSON.stringify(bundle, null, 2), 'application/json')
    setToast('Project bundle exported locally')
  }

  const runRepositoryAnalysis = async (rootName: string, entries: { path: string; file: File }[]) => {
    const requestId = uid()
    importRunRef.current = requestId
    setPendingImport(null)
    setImportProgress({ phase: 'checking files locally', completed: 0, total: entries.length, rootName })
    const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'coverage', 'vendor', '.turbo', 'out', 'target'])
    const secretPattern = /(^|\/)(\.env($|\.)|id_rsa|id_ed25519|credentials?([._-].*)?$|secrets?([._-].*)?$|service[-_]?account(\..*)?$|firebase-adminsdk[^/]*$)|\.(pem|key|p12|pfx|jks|keystore|crt|cer)$/i
    const supported = /\.(ts|tsx|js|jsx|mts|cts|mjs|cjs)$/i
    const config = /(^|\/)(package\.json|tsconfig\.json|jsconfig\.json|next\.config\.(js|mjs|ts|mts)|pnpm-lock\.yaml|yarn\.lock|package-lock\.json)$/i
    const skipped: { path: string; size: number; reason: string }[] = []
    const sources: { path: string; text: string; size: number }[] = []
    let excludedSecretFiles = 0
    let totalBytes = 0
    const maxFiles = 12_000
    const maxBytes = 120 * 1024 * 1024
    const maxFileBytes = 2 * 1024 * 1024
    for (let index = 0; index < entries.length; index++) {
      if (importRunRef.current !== requestId) return
      const { path: rawPath, file } = entries[index]
      const path = rawPath.replaceAll('\\', '/').replace(/^\/+/, '')
      if (path.split('/').some((part) => ignoredDirectories.has(part))) continue
      if (secretPattern.test(path)) { excludedSecretFiles++; continue }
      if (!supported.test(path) && !config.test(path) && !/\.json$/i.test(path)) {
        if (skipped.length < 50_000) skipped.push({ path, size: file.size, reason: 'File type is outside this analysis profile.' })
        continue
      }
      if (sources.length >= maxFiles) { skipped.push({ path, size: file.size, reason: `The ${maxFiles.toLocaleString()} file analysis limit was reached.` }); continue }
      if (file.size > maxFileBytes) { skipped.push({ path, size: file.size, reason: 'File exceeds the 2 MiB per-file analysis limit.' }); continue }
      if (totalBytes + file.size > maxBytes) { skipped.push({ path, size: file.size, reason: 'Local analysis stopped at the 120 MiB source-content budget.' }); continue }
      try {
        const text = await file.text()
        sources.push({ path, text, size: file.size })
        totalBytes += file.size
      } catch {
        skipped.push({ path, size: file.size, reason: 'The browser could not read this selected file.' })
      }
      if (index % 25 === 0) setImportProgress({ phase: 'reading selected files', completed: index + 1, total: entries.length, rootName })
    }
    if (importRunRef.current !== requestId) return
    setImportProgress({ phase: 'parsing and resolving local modules', completed: 0, total: sources.length, rootName })
    const request: AnalysisRequest = { type: 'analyze', requestId, rootName, files: sources, excludedSecretFiles, skipped }
    await new Promise<void>((resolve, reject) => {
      const worker = new Worker(new URL('./importer/analysis.worker.ts', import.meta.url), { type: 'module' })
      analysisWorkerRef.current = worker
      worker.onmessage = (event: MessageEvent<AnalysisResponse>) => {
        if (importRunRef.current !== requestId) { worker.terminate(); resolve(); return }
        const message = event.data
        if (message.type === 'progress') { setImportProgress({ phase: message.phase, completed: message.completed, total: message.total, rootName }); return }
        worker.terminate(); analysisWorkerRef.current = null
        if (message.type === 'error') { reject(new Error(message.message)); return }
        const model = message.model
        const summary: AnalysisSummary = {
          elements: model.elements.length,
          files: message.snapshot.files.length,
          parsedFiles: message.snapshot.files.filter((item) => item.status === 'parsed').length,
          imports: model.relationships.filter((edge) => edge.kind === 'imports').length,
          symbols: model.elements.filter((element) => ['function', 'class', 'interface', 'type'].includes(element.kind)).length,
          routes: model.elements.filter((element) => element.kind === 'api-endpoint').length,
          packages: model.elements.filter((element) => element.kind === 'package').length,
          warnings: message.snapshot.warnings.length,
          findings: message.snapshot.findings?.length ?? 0,
          sourceBytes: sources.reduce((total, file) => total + file.size, 0),
        }
        setPendingImport({ model, snapshot: message.snapshot, summary })
        setApplyAdditions(true); setApplyUpdates(true); setRemoveDeleted(false)
        setImportProgress(null); setView('import-review'); setSelectedId(null); setToast('Local repository analysis is ready to review')
        resolve()
      }
      worker.onerror = (event) => { worker.terminate(); analysisWorkerRef.current = null; reject(new Error(event.message || 'The local analysis worker stopped unexpectedly.')) }
      worker.postMessage(request)
    }).catch((error: unknown) => {
      if (importRunRef.current !== requestId) return
      setImportProgress(null)
      setToast(error instanceof Error ? error.message : 'Could not analyze the selected repository.')
    })
  }

  const chooseRepository = async () => {
    setModal(null)
    const selectionId = uid()
    importRunRef.current = selectionId
    const pickerWindow = window as Window & { showDirectoryPicker?: (options?: { mode?: 'read' }) => Promise<unknown> }
    if (!pickerWindow.showDirectoryPicker) {
      const input = repositoryInputRef.current
      if (!input) { setToast('This browser cannot open a local directory.'); return }
      input.setAttribute('webkitdirectory', '')
      input.setAttribute('directory', '')
      input.click()
      return
    }
    try {
      type DirectoryEntry = { kind: string; getFile?: () => Promise<File>; entries?: () => AsyncIterable<[string, unknown]> }
      type DirectoryHandle = { name: string; entries: () => AsyncIterable<[string, DirectoryEntry]> }
      const rawHandle = await pickerWindow.showDirectoryPicker({ mode: 'read' }) as DirectoryHandle
      const files: { path: string; file: File }[] = []
      const queue: { path: string; handle: DirectoryHandle }[] = [{ path: '', handle: rawHandle }]
      while (queue.length) {
        if (importRunRef.current !== selectionId) return
        const current = queue.shift()!
        if (!current.handle.entries) continue
        for await (const [name, entry] of current.handle.entries()) {
          const path = current.path ? `${current.path}/${name}` : name
          if (['.git', 'node_modules', 'dist', 'build', '.next', 'coverage', 'vendor', '.turbo', 'out', 'target'].includes(name)) continue
          if (entry.kind === 'directory') queue.push({ path, handle: entry as unknown as DirectoryHandle })
          else if (entry.kind === 'file' && entry.getFile) {
            const file = await entry.getFile()
            files.push({ path, file })
          }
        }
        if (files.length % 100 === 0) setImportProgress({ phase: 'listing the selected directory', completed: files.length, total: 0, rootName: rawHandle.name })
      }
      await runRepositoryAnalysis(rawHandle.name, files)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setImportProgress(null)
      setToast(error instanceof Error ? error.message : 'Could not open the selected directory.')
    }
  }

  const onRepositoryFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.currentTarget.files ?? [])
    if (!selectedFiles.length) return
    const firstPath = selectedFiles[0].webkitRelativePath || selectedFiles[0].name
    const rootName = firstPath.includes('/') ? firstPath.split('/')[0] : 'Selected repository'
    const entries = selectedFiles.map((file) => ({ path: file.webkitRelativePath?.includes('/') ? file.webkitRelativePath.split('/').slice(1).join('/') : file.name, file }))
    void runRepositoryAnalysis(rootName, entries)
    event.currentTarget.value = ''
  }

  const cancelRepositoryAnalysis = () => {
    importRunRef.current = null
    analysisWorkerRef.current?.terminate()
    analysisWorkerRef.current = null
    setImportProgress(null)
    setToast('Repository analysis cancelled')
  }

  const applyRepositoryImport = () => {
    if (!pendingImport) return
    let conflictCount = 0
    const incomingSnapshot = clone(pendingImport.snapshot)
    mutateProject((current) => {
      const scenario = activeScenario(current)
      const previousFindings = new Map((current.repository?.findings ?? []).map((finding) => [finding.id, finding.status]))
      incomingSnapshot.findings = (incomingSnapshot.findings ?? []).map((finding) => ({ ...finding, status: previousFindings.get(finding.id) ?? 'open' }))
      const merged = applyRepositoryModel(scenario.model, current.baseline, pendingImport.model, applyAdditions, applyUpdates, removeDeleted)
      scenario.model = merged.model
      if ((current.repository && current.repository.fingerprint !== incomingSnapshot.fingerprint) || (!current.repository && current.baseline.elements.length)) current.baselineHistory = [...(current.baselineHistory ?? []), { id: uid(), name: `Before ${incomingSnapshot.rootName} re-import`, capturedAt: new Date().toISOString(), model: clone(current.baseline), repository: current.repository ? clone(current.repository) : undefined }].slice(-3)
      current.baseline = mergeRepositoryBaseline(current.baseline, pendingImport.model)
      current.repository = incomingSnapshot
      conflictCount = merged.conflicts.length
    })
    setPendingImport(null); setView('repository'); setSelectedId(null)
    setToast(conflictCount ? `Import applied; ${conflictCount} scenario edits were preserved for review` : 'Repository snapshot applied locally')
  }

  const discardPendingImport = () => { setPendingImport(null); setView('repository'); setToast('Repository analysis discarded') }

  const updateFindingStatus = (findingId: string, status: FindingStatus) => mutateProject((current) => {
    if (!current.repository) return
    current.repository.findings = (current.repository.findings ?? []).map((finding) => finding.id === findingId ? { ...finding, status } : finding)
  })

  const importBundle = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error('Project bundles must be smaller than 50 MB.')
      const parsed: unknown = JSON.parse(await file.text())
      if (validateWorkspace(parsed)) {
        commit(() => parsed)
        setSelectedId(null); setModal(null); setToast('Workspace bundle imported')
      } else if (validateProjectBundle(parsed)) {
        const incoming = clone(parsed.project)
        let renamed = false
        commit((current) => {
          if (current.projects.some((item) => item.id === incoming.id)) incoming.id = uid()
          if (current.projects.some((item) => item.name === incoming.name)) { incoming.name = `${incoming.name} (imported)`; renamed = true }
          current.projects.push(incoming)
          current.activeProjectId = incoming.id
          return current
        })
        setSelectedId(null); setModal(null); setToast(renamed ? 'Project imported as a separate local copy' : 'Project bundle imported')
      } else throw new Error('This file is not a supported Architecture Lab workspace or project bundle.')
    } catch (error) { setToast(error instanceof Error ? error.message : 'Could not read this project bundle') }
    event.currentTarget.value = ''
  }

  const download = (filename: string, body: string, type: string) => {
    const url = URL.createObjectURL(new Blob([body], { type }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url)
  }

  if (!hydrated || !workspace || !project || !scenario || !model) return <div className="loading"><div className="brand-mark">A</div><span>Opening your local workspace…</span></div>

  const filteredElements = model.elements.filter((element) => !searchQuery || `${element.name} ${element.kind} ${element.path} ${element.description}`.toLowerCase().includes(searchQuery.toLowerCase()))
  const architecturalElements = filteredElements.filter((element) => (searchQuery || selectedId === element.id || !['function', 'class', 'interface', 'type'].includes(element.kind)) && (searchQuery || !element.tags.includes('npm-dependency')))
  const canvasElements = architecturalElements.length <= 900 ? architecturalElements : [...architecturalElements.slice(0, 900), ...architecturalElements.filter((element) => element.id === selectedId && !architecturalElements.slice(0, 900).some((shown) => shown.id === element.id))]
  const canvasElementIds = new Set(canvasElements.map((element) => element.id))
  const visibleEdgeIds = new Set<string>()
  const canvasRelationships: Relationship[] = []
  for (const element of canvasElements) {
    for (const edge of relationshipIndex.get(element.id) ?? []) {
      if (!canvasElementIds.has(edge.fromId) || !canvasElementIds.has(edge.toId) || visibleEdgeIds.has(edge.id)) continue
      visibleEdgeIds.add(edge.id); canvasRelationships.push(edge)
      if (canvasRelationships.length >= 2500) break
    }
    if (canvasRelationships.length >= 2500) break
  }
  const canvasWidth = Math.max(canvasRef.current?.clientWidth ?? 900, ...canvasElements.map((element) => element.x + 220), 900)
  const canvasHeight = Math.max(canvasRef.current?.clientHeight ?? 500, ...canvasElements.map((element) => element.y + 110), 500)
  const statusLabel = saveState === 'saved' ? 'Saved locally' : saveState === 'saving' || saveState === 'loading' ? 'Saving locally…' : 'Local save needs attention'


  return <div className={`app-shell theme-${workspace.theme}`}>
    <aside className="rail">
      <button className="brand-mark" title="Architecture Lab" onClick={() => setView('canvas')}>A</button>
      <div className="rail-rule" />
      <NavButton active={view === 'canvas'} icon={Network} label="Architecture" onClick={() => setView('canvas')} />
      <NavButton active={view === 'repository'} icon={FolderTree} label="Repository" onClick={() => setView('repository')} />
      <NavButton active={view === 'findings'} icon={Activity} label="Review" badge={project.repository?.findings?.filter((finding) => finding.status === 'open').length} onClick={() => setView('findings')} />
      <NavButton active={view === 'flows'} icon={Workflow} label="Flows" onClick={() => setView('flows')} />
      <div className="rail-spacer" />
      <NavButton active={view === 'plan'} icon={ArrowUpRight} label="Change plan" onClick={() => setView('plan')} />
      <div className="rail-bottom">
        <button className="icon-button rail-help" title="Keyboard shortcuts" onClick={() => setCommandOpen(true)}><CircleHelp size={18} /></button>
        <button className="avatar" title="Local workspace" onClick={exportBundle}>Y</button>
      </div>
    </aside>

    <div className="main-column">
      <header className="topbar">
        <div className="project-picker-wrap">
          <button className="project-picker" onClick={() => document.getElementById('project-select')?.focus()}>
            <span className="project-icon"><Boxes size={16} /></span><span className="project-picker-copy"><strong>{project.name}</strong><small>Local project</small></span><ChevronDown size={15} />
          </button>
          <select id="project-select" className="project-select" aria-label="Switch project" value={project.id} onChange={(event) => { commit((current) => { current.activeProjectId = event.target.value; return current }); setSelectedId(null) }}>
            {workspace.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button className="tiny-add" aria-label="Create project" onClick={() => setModal('project')}><Plus size={14} /></button>
        </div>
        <div className="breadcrumbs"><ChevronRight size={14} /><span>{view === 'canvas' ? 'Architecture' : view === 'repository' ? 'Repository' : view === 'findings' ? 'Review' : view === 'flows' ? 'Flows' : 'Planning'}</span><ChevronRight size={14} /><strong>{view === 'flows' ? selectedFlow?.name ?? 'No flows' : view === 'findings' ? 'Stack findings' : scenario.name}</strong></div>
        <div className="top-actions">
          <span className={`save-indicator ${saveState}`}><span className="save-dot" />{statusLabel}</span>
          <button className="icon-button" title="Undo (Ctrl/Cmd+Z)" onClick={undo} disabled={!history.past.length}><Undo2 size={17} /></button>
          <button className="icon-button" title="Redo (Ctrl/Cmd+Shift+Z)" onClick={redo} disabled={!history.future.length}><Redo2 size={17} /></button>
          <button className="command-trigger" onClick={() => { setCommandOpen(true); setCommandQuery('') }}><Command size={14} /><span>Commands</span><kbd>⌘ K</kbd></button>
          <button className="avatar small-avatar" title="Export local workspace" onClick={exportBundle}>Y</button>
        </div>
      </header>

      <main className="content-area">
        {view === 'canvas' && <>
          <div className="view-heading">
            <div><div className="eyebrow">SYSTEM OVERVIEW <span className="eyebrow-dot" /> {model.elements.length} ELEMENTS</div><h1>Architecture map</h1><p>Explore how the parts of your system connect. Select an element to inspect its role.</p></div>
            <div className="heading-actions"><button className="button secondary" onClick={captureBaseline}><GitBranch size={15} /> Capture baseline</button><button className="button secondary" onClick={() => setModal('scenario')}><GitBranch size={15} /> Branch scenario</button><button className="button primary" onClick={() => setModal('element')}><Plus size={16} /> Add element</button></div>
          </div>
          <section className="scenario-strip">
            <div className="scenario-label"><GitBranch size={15} /><span>SCENARIO</span></div>
            <select value={scenario.id} onChange={(event) => switchScenario(event.target.value)} aria-label="Active scenario" className="scenario-select">{project.scenarios.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
            <span className="scenario-description">{scenario.description || 'Exploring a change against the project baseline.'}</span>
            <button className="text-button" onClick={() => setModal('scenario')}><Plus size={14} /> New branch</button>
            <button className="text-button" onClick={() => { setWorkspaceTheme(workspace, commit); }} title="Toggle appearance"><Sparkles size={14} /> {workspace.theme === 'dark' ? 'Dark' : 'Light'}</button>
          </section>
          <div className={`workspace-grid ${inspectorOpen ? '' : 'inspector-hidden'}`}>
            <div className="canvas-card">
              <div className="canvas-toolbar"><div className="canvas-view-tabs"><button className="canvas-tab active"><Network size={14} /> System map</button><button className="canvas-tab" onClick={() => setView('flows')}><Workflow size={14} /> Flow view</button></div><div className="canvas-tools">
                {searchOpen ? <div className="search-inline"><Search size={14} /><input id="global-search" placeholder="Search elements…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === 'Escape' && (setSearchQuery(''), setSearchOpen(false))} autoFocus /><button onClick={() => { setSearchQuery(''); setSearchOpen(false) }}><X size={13} /></button></div> : <button className="canvas-icon" title="Search elements (/)" onClick={() => setSearchOpen(true)}><Search size={16} /></button>}
                <button className="canvas-icon" title={inspectorOpen ? 'Hide inspector' : 'Show inspector'} onClick={() => setInspectorOpen((open) => !open)}>{inspectorOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}</button><button className="canvas-icon" title="More canvas actions" onClick={() => setModal('relationship')}><MoreHorizontal size={17} /></button>
              </div></div>
              <div className="canvas-stage" ref={canvasRef} onPointerDown={(event) => { if (!(event.target as HTMLElement).closest('.architecture-node')) setSelectedId(null) }}>
                <div className="canvas-scene" style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
                <div className="canvas-grid" />
                <svg className="edge-layer" aria-label="Architecture relationships">
                  <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
                  {canvasRelationships.map((edge) => {
                    const from = elementsById.get(edge.fromId), to = elementsById.get(edge.toId)
                    if (!from || !to || !canvasElementIds.has(from.id) || !canvasElementIds.has(to.id)) return null
                    const sx = from.x + 100, sy = from.y + 45, ex = to.x + 100, ey = to.y + 45, bend = Math.max(35, Math.abs(ex - sx) * .32)
                    const path = `M ${sx} ${sy} C ${sx + bend} ${sy}, ${ex - bend} ${ey}, ${ex} ${ey}`
                    return <g key={edge.id} className={`edge ${edge.status} ${selectedId === edge.fromId || selectedId === edge.toId ? 'edge-active' : ''}`}><path d={path} markerEnd="url(#arrow)" /><text x={(sx + ex) / 2} y={(sy + ey) / 2 - 7}>{edge.label || edge.kind}</text></g>
                  })}
                </svg>
                {canvasElements.map((element) => <ArchitectureNode key={element.id} element={element} selected={selectedId === element.id} onSelect={() => setSelectedId(element.id)} onMove={(x, y) => updateElement(element.id, { x, y })} container={canvasRef.current} />)}
                {!model.elements.length && <div className="empty-canvas"><div className="empty-icon"><Network size={24} /></div><h3>Start with the system shape</h3><p>Add an application, a data store, or the responsibility you want to change.</p><button className="button primary" onClick={() => setModal('element')}><Plus size={15} /> Add your first element</button></div>}
                </div>
                <div className="canvas-legend"><span><i className="legend-dot observed" /> Observed</span><span><i className="legend-dot declared" /> Declared</span><span><i className="legend-dot inferred" /> Inferred</span><span><i className="legend-dot proposed" /> Proposed</span><span><i className="legend-line" /> Relationship</span></div>
              </div>
              <div className="canvas-footer"><span><span className="live-dot" /> Local model</span><span>{canvasElements.length < architecturalElements.length ? `Showing ${canvasElements.length} of ${architecturalElements.length} in this view` : `${model.elements.length} elements`} <i /> {model.relationships.length} relationships <i /> {model.flows.length} flows</span><span>Drag to arrange · scroll to explore <kbd>⌘ K</kbd></span></div>
            </div>
            {inspectorOpen && <Inspector element={selected} edges={selectedRelationships} edgeCount={selectedRelationshipCount} elementsById={elementsById} onUpdate={updateElement} onDelete={removeElement} onAddRelationship={() => setModal('relationship')} />}
          </div>
        </>}

        {view === 'repository' && <RepositoryView model={model} snapshot={project.repository} onAdd={() => setModal('element')} onImport={() => setModal('repository')} onSelect={(id) => { setSelectedId(id); setView('canvas') }} />}
        {view === 'findings' && <FindingsView findings={project.repository?.findings ?? []} model={model} onStatus={updateFindingStatus} onSelect={(id) => { setSelectedId(id); setView('canvas') }} onImport={() => setModal('repository')} />}
        {view === 'import-review' && pendingImport && <ImportReviewView result={pendingImport} previous={project.repository} current={scenario.model} baseline={project.baseline} applyAdditions={applyAdditions} applyUpdates={applyUpdates} removeDeleted={removeDeleted} setApplyAdditions={setApplyAdditions} setApplyUpdates={setApplyUpdates} setRemoveDeleted={setRemoveDeleted} onApply={applyRepositoryImport} onDiscard={discardPendingImport} />}
        {view === 'flows' && <FlowsView flows={model.flows} elements={model.elements} onAdd={() => setModal('flow')} onAddStep={addStep} onUpdateStep={updateFlowStep} onUpdateFlow={updateFlow} />}
        {view === 'plan' && <PlanView project={project} scenario={scenario} model={model} onExport={exportPlan} onAddDecision={addPlanningDecision} onUpdateDecision={updatePlanningDecision} onRemoveDecision={removePlanningDecision} onExportProject={exportProjectBundle} onImportProject={() => importRef.current?.click()} />}
      </main>
      <footer className="statusbar"><span><span className="status-led" /> LOCAL FIRST</span><span>Private by default <i /> No code is uploaded</span><span className="statusbar-right">Workspace autosaved locally</span></footer>
    </div>

    {modal && <ModalHost type={modal} elements={model.elements} onClose={() => setModal(null)} onElement={addElement} onRelationship={addRelationship} onFlow={addFlow} onProject={createProject} onProjectAndImport={createProjectAndImport} onScenario={createScenario} onImport={() => importRef.current?.click()} onChooseRepository={chooseRepository} />}
    <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importBundle} />
    <input ref={repositoryInputRef} type="file" multiple hidden onChange={onRepositoryFilesSelected} />
    {commandOpen && <CommandPalette query={commandQuery} setQuery={setCommandQuery} onClose={() => setCommandOpen(false)} onAction={(action) => { setCommandOpen(false); action() }} actions={[
      { label: 'Add architecture element', hint: 'Create a new node', icon: Plus, run: () => setModal('element') },
      { label: 'Create relationship', hint: 'Connect two elements', icon: Link2, run: () => setModal('relationship') },
      { label: 'Create flow', hint: 'Model a user behavior', icon: Workflow, run: () => setModal('flow') },
      { label: 'Branch scenario', hint: 'Explore an alternative', icon: GitBranch, run: () => setModal('scenario') },
      { label: 'Capture baseline', hint: 'Freeze the active model as the project baseline', icon: GitBranch, run: captureBaseline },
      { label: 'Export change plan', hint: 'Download Markdown', icon: Download, run: exportPlan },
      { label: 'Import project bundle', hint: 'Load a local JSON file', icon: Upload, run: () => importRef.current?.click() },
      { label: 'Export workspace bundle', hint: 'Save all local projects', icon: Download, run: exportBundle },
      { label: 'Open repository tree', hint: 'Browse modeled paths', icon: FolderTree, run: () => setView('repository') },
      { label: 'Import local repository', hint: 'Analyze selected source files on this device', icon: Upload, run: () => setModal('repository') },
      { label: 'Undo last change', hint: 'Ctrl/Cmd + Z', icon: Undo2, run: undo },
      { label: 'Redo last change', hint: 'Ctrl/Cmd + Shift + Z', icon: Redo2, run: redo },
    ]} />}
    {importProgress && <div className="modal-backdrop import-progress-backdrop"><div className="import-progress-card"><div className="import-spinner" /><span className="eyebrow">LOCAL REPOSITORY ANALYSIS</span><h2>{importProgress.rootName}</h2><p>{importProgress.phase}</p><div className="progress-track"><i style={{ width: `${importProgress.total ? Math.min(100, importProgress.completed / importProgress.total * 100) : 12}%` }} /></div><div className="progress-label">{importProgress.total ? `${importProgress.completed.toLocaleString()} of ${importProgress.total.toLocaleString()}` : `${importProgress.completed.toLocaleString()} files indexed`}</div><button className="button secondary" onClick={cancelRepositoryAnalysis}>Cancel analysis</button></div></div>}
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
  </div>
}

function setWorkspaceTheme(workspace: Workspace, commit: (update: (current: Workspace) => Workspace) => void) { commit((current) => { current.theme = workspace.theme === 'dark' ? 'light' : 'dark'; return current }) }
function slug(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'architecture' }

function NavButton({ active, icon: Icon, label, onClick, badge }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void; badge?: number }) { return <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick} title={label}><Icon size={18} /><span>{label}</span>{badge ? <b className="nav-badge">{badge > 99 ? '99+' : badge}</b> : null}</button> }

function ArchitectureNode({ element, selected, onSelect, onMove, container }: { element: Element; selected: boolean; onSelect: () => void; onMove: (x: number, y: number) => void; container: HTMLDivElement | null }) {
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const Icon = kindIcon(element.kind)
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    event.preventDefault(); onSelect()
    const startX = event.clientX, startY = event.clientY, originX = element.x, originY = element.y
    const positionAt = (clientX: number, clientY: number) => ({ x: Math.max(0, originX + (clientX - startX)), y: Math.max(0, originY + (clientY - startY)) })
    const move = (moveEvent: globalThis.PointerEvent) => { if (container) setDragPosition(positionAt(moveEvent.clientX, moveEvent.clientY)) }
    const up = (upEvent: globalThis.PointerEvent) => { const final = positionAt(upEvent.clientX, upEvent.clientY); onMove(final.x, final.y); setDragPosition(null); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true })
  }
  return <div className={`architecture-node ${element.status} ${selected ? 'selected' : ''}`} style={{ left: `${dragPosition?.x ?? element.x}px`, top: `${dragPosition?.y ?? element.y}px` }} onPointerDown={start} onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>
    <span className="node-icon"><Icon size={16} /></span><span className="node-copy"><small>{kindLabel(element.kind)}</small><strong>{element.name}</strong>{element.path && <em>{element.path}</em>}</span><span className={`node-status ${element.status}`} />
  </div>
}

function Inspector({ element, edges, edgeCount, elementsById, onUpdate, onDelete, onAddRelationship }: { element: Element | null; edges: Relationship[]; edgeCount: number; elementsById: Map<string, Element>; onUpdate: (id: string, patch: Partial<Element>) => void; onDelete: (id: string) => void; onAddRelationship: () => void }) {
  return <aside className="inspector">
    <div className="inspector-heading"><div><span className="eyebrow">INSPECTOR</span><h2>{element ? 'Element details' : 'Explore the model'}</h2></div><button className="icon-button" aria-label="More details"><MoreHorizontal size={17} /></button></div>
    {element ? <>
      <div className="inspector-identity"><span className="identity-icon">{(() => { const Icon = kindIcon(element.kind); return <Icon size={19} /> })()}</span><div><span className="kind-chip">{kindLabel(element.kind)}</span><strong>{element.name}</strong></div></div>
      <div className="field"><label htmlFor="element-name">Name</label><input id="element-name" value={element.name} onChange={(event) => onUpdate(element.id, { name: event.target.value })} /></div>
      <div className="field"><label htmlFor="element-description">Responsibility</label><textarea id="element-description" value={element.description} placeholder="What does this element own?" onChange={(event) => onUpdate(element.id, { description: event.target.value })} rows={3} /></div>
      <div className="field"><label htmlFor="element-path">Repository path</label><div className="input-with-icon"><FileCode2 size={14} /><input id="element-path" value={element.path} placeholder="src/..." onChange={(event) => onUpdate(element.id, { path: event.target.value })} /></div></div>
      <div className="field"><label htmlFor="element-status">Model status</label><select id="element-status" value={element.status} onChange={(event) => onUpdate(element.id, { status: event.target.value as Element['status'] })}><option value="declared">Declared</option><option value="proposed">Proposed</option><option value="inferred">Inferred</option><option value="observed">Observed</option></select><small className="field-help">Proposed items describe a scenario change, not confirmed production behavior.</small></div>
      {element.source && <div className="inspector-section evidence-section"><div className="section-heading"><span>Source evidence</span><span className="evidence-confidence">LOCAL</span></div><div className="evidence-reference"><FileCode2 size={13} /><code>{element.source.path}{element.source.startLine ? `:${element.source.startLine}` : ''}</code></div><p>{element.source.summary}</p><small>{element.source.analyzer} · {element.source.rule}</small></div>}
      <div className="inspector-section"><div className="section-heading"><span>Connections</span><button className="text-button small" onClick={onAddRelationship}><Plus size={13} /> Add</button></div>
        {edges.length ? edges.map((edge) => { const other = elementsById.get(edge.fromId === element.id ? edge.toId : edge.fromId); return <div className="connection-row" key={edge.id} title={edge.source ? `${edge.source.path}:${edge.source.startLine ?? 1} · ${edge.source.summary}` : undefined}><span className="connection-kind">{edge.kind}</span><ArrowRight size={12} /><span className="connection-name">{other?.name ?? 'Unknown element'}{edge.source && <small className="connection-evidence">{edge.source.path}:{edge.source.startLine ?? 1}</small>}</span></div> }) : <p className="subtle-copy">No connections yet. Add a typed relationship to show how this element interacts.</p>}{edgeCount > edges.length && <p className="subtle-copy">Showing the first {edges.length} of {edgeCount} connections.</p>}
      </div>
      <div className="inspector-bottom"><span><span className={`status-chip ${element.status}`} /> {element.status[0].toUpperCase() + element.status.slice(1)} model fact</span><button className="danger-button" onClick={() => onDelete(element.id)}><Trash2 size={14} /> Remove</button></div>
    </> : <div className="inspector-empty"><div className="empty-icon"><Sparkles size={20} /></div><h3>Select an element</h3><p>Inspect responsibilities, repository references, and relationships without losing the canvas context.</p><div className="quick-tips"><span><kbd>⌘ K</kbd> Open commands</span><span><kbd>/</kbd> Search elements</span><span>Choose an element on the canvas to begin</span></div></div>}
  </aside>
}

function RepositoryView({ model, snapshot, onAdd, onImport, onSelect }: { model: ArchitectureModel; snapshot?: RepositorySnapshot; onAdd: () => void; onImport: () => void; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const allPathItems = model.elements.filter((element) => element.path).sort((a, b) => a.path.localeCompare(b.path))
  const pathItems = allPathItems.filter((element) => `${element.path} ${element.name} ${element.kind}`.toLowerCase().includes(query.toLowerCase()))
  const visiblePathItems = pathItems.slice(0, 500)
  const dirs = new Set<string>()
  for (const element of visiblePathItems) { const parts = element.path.split('/'); for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/')) }
  return <div className="page-view"><div className="view-heading"><div><div className="eyebrow">PROJECT MODEL <span className="eyebrow-dot" /> PATHS AND RESPONSIBILITIES</div><h1>Repository map</h1><p>Browse source-backed modules, exported symbols, routes, and local import findings.</p></div><div className="heading-actions"><button className="button secondary" onClick={onAdd}><Plus size={15} /> Add path</button><button className="button primary" onClick={onImport}><Upload size={15} /> {snapshot ? 'Re-import repository' : 'Import local repository'}</button></div></div>
    {snapshot && <div className="repository-snapshot"><div className="snapshot-icon"><Check size={16} /></div><div className="snapshot-main"><strong>{snapshot.rootName}</strong><span>{snapshot.files.length.toLocaleString()} local files · {snapshot.frameworks.join(', ') || 'Framework not detected'}{snapshot.packageManager ? ` · ${snapshot.packageManager}` : ''}</span></div><div className="snapshot-meta"><span>{snapshot.analyzerVersion}</span><span>Fingerprint {snapshot.fingerprint.slice(0, 12)}</span></div><button className="text-button" onClick={onImport}><ArrowLeftRight size={14} /> Refresh</button></div>}
    <div className="repository-card"><div className="repository-top"><div><FolderTree size={17} /><strong>Project tree</strong><span>{pathItems.length} matching elements</span></div><div className="repo-tree-actions"><label className="repo-search"><Search size={13} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter paths and symbols" aria-label="Filter repository paths" /></label><button className="text-button" onClick={onAdd}><Plus size={14} /> Add path</button></div></div>
      {visiblePathItems.length ? <div className="tree-list">{([...Array.from(dirs).map((path) => ({ path, dir: true, depth: path.split('/').length })), ...visiblePathItems.map((item) => ({ path: item.path, dir: false, depth: item.path.split('/').length, item }))] as { path: string; dir: boolean; depth: number; item?: Element }[]).sort((a, b) => a.path.localeCompare(b.path) || Number(b.dir) - Number(a.dir)).map((row) => <button key={row.dir ? `d-${row.path}` : `e-${row.item?.id}`} className={`tree-row ${row.dir ? 'directory' : ''}`} style={{ paddingLeft: `${16 + (row.depth - 1) * 22}px` }} onClick={() => row.item && onSelect(row.item.id)}><ChevronRight size={13} className={row.dir ? '' : 'invisible'} />{row.dir ? <FolderTree size={15} /> : <FileCode2 size={15} />}<span>{row.path.split('/').at(-1)}</span>{row.item && <><span className="tree-kind">{kindLabel(row.item.kind)}</span><span className={`status-chip ${row.item.status}`} /></>}</button>)}</div> : <div className="empty-state"><FolderTree size={25} /><h3>{query ? 'No matching paths or symbols' : 'No repository paths yet'}</h3><p>{query ? 'Try another path, filename, symbol, or element type.' : 'Manually add paths or import a local repository to ground this architecture in source.'}</p><button className="button secondary" onClick={query ? () => setQuery('') : onAdd}>{query ? 'Clear filter' : <><Plus size={14} /> Add first path</>}</button></div>}
      {pathItems.length > visiblePathItems.length && <div className="tree-limit-note">Showing the first 500 matches; narrow the filter to find another path.</div>}
    </div>{snapshot?.warnings.length ? <div className="repo-warning-summary"><Activity size={14} /><span>{snapshot.warnings.length} analysis notes</span><span>{snapshot.warnings.filter((warning) => warning.code === 'unresolved-import').length} unresolved local imports</span><span>{snapshot.files.filter((file) => file.status === 'skipped').length} skipped files</span></div> : null}</div>
}

function FindingsView({ findings, model, onStatus, onSelect, onImport }: { findings: ArchitectureFinding[]; model: ArchitectureModel; onStatus: (id: string, status: FindingStatus) => void; onSelect: (id: string) => void; onImport: () => void }) {
  const [filter, setFilter] = useState<'open' | 'all' | 'resolved' | 'suppressed'>('open')
  const [query, setQuery] = useState('')
  const elementMap = useMemo(() => new Map(model.elements.map((element) => [element.id, element])), [model.elements])
  const dependents = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const edge of model.relationships) if (edge.kind === 'imports') map.set(edge.toId, [...(map.get(edge.toId) ?? []), edge.fromId])
    return map
  }, [model.relationships])
  const impactFor = (finding: ArchitectureFinding) => {
    const seen = new Set(finding.elementIds)
    const frontier = [...finding.elementIds]
    for (let depth = 0; depth < 3 && frontier.length; depth++) {
      const next: string[] = []
      for (const id of frontier) for (const dependent of dependents.get(id) ?? []) if (!seen.has(dependent)) { seen.add(dependent); next.push(dependent) }
      frontier.splice(0, frontier.length, ...next)
    }
    return [...seen].map((id) => elementMap.get(id)).filter((item): item is Element => !!item)
  }
  const visible = findings.filter((finding) => (filter === 'all' || finding.status === filter) && (!query || `${finding.title} ${finding.description} ${finding.recommendation} ${finding.evidence.map((item) => item.path).join(' ')}`.toLowerCase().includes(query.toLowerCase())))
  const shown = visible.slice(0, 150)
  const counts = { open: findings.filter((item) => item.status === 'open').length, resolved: findings.filter((item) => item.status === 'resolved').length, suppressed: findings.filter((item) => item.status === 'suppressed').length }
  return <div className="page-view findings-page">
    <div className="view-heading"><div><div className="eyebrow">STACK-AWARE REVIEW <span className="eyebrow-dot" /> LOCAL ANALYSIS</div><h1>Architecture findings</h1><p>Review cache, database, client state, offline storage, and browser storage patterns with evidence from this repository.</p></div><div className="heading-actions">{findings.length > 0 && <button className="button secondary" onClick={onImport}><ArrowLeftRight size={14} /> Refresh analysis</button>}</div></div>
    <div className="findings-summary"><span><strong>{counts.open}</strong> open</span><span><strong>{counts.resolved}</strong> resolved</span><span><strong>{counts.suppressed}</strong> suppressed</span><span className="finding-summary-note">Static heuristics show likely concerns, not runtime proof. Confirm each item against surrounding code.</span></div>
    {!findings.length ? <div className="empty-state findings-empty"><Activity size={25} /><h3>No stack findings yet</h3><p>Import a repository to scan Mongoose, Redis, RTK Query, IndexedDB, and browser storage patterns locally.</p><button className="button primary" onClick={onImport}><FolderTree size={14} /> Import repository</button></div> : <section className="findings-panel">
      <div className="findings-toolbar"><div className="findings-filters">{(['open', 'all', 'resolved', 'suppressed'] as const).map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item === 'all' ? 'All' : item[0].toUpperCase() + item.slice(1)}{item !== 'all' && <small>{counts[item]}</small>}</button>)}</div><label className="repo-search"><Search size={13} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter findings" aria-label="Filter findings" /></label></div>
      <div className="finding-list">{shown.map((finding) => {
        const affected = impactFor(finding)
        return <article className={`finding-card ${finding.status}`} key={finding.id}>
          <div className="finding-heading"><span className={`severity-mark ${finding.severity}`}>{finding.severity}</span><span className="finding-category">{finding.category.replaceAll('-', ' ')}</span><span className="finding-confidence">{finding.confidence} confidence</span><span className={`finding-state ${finding.status}`}>{finding.status}</span></div>
          <h2>{finding.title}</h2><p>{finding.description}</p>
          <div className="finding-recommendation"><strong>Review action</strong><span>{finding.recommendation}</span></div>
          <div className="finding-evidence"><strong>Evidence</strong>{finding.evidence.slice(0, 4).map((evidence) => <button key={`${evidence.path}-${evidence.startLine}`} onClick={() => { const target = finding.elementIds.find((id) => elementMap.get(id)?.path === evidence.path); if (target) onSelect(target) }}><FileCode2 size={13} /><code>{evidence.path}{evidence.startLine ? `:${evidence.startLine}` : ''}</code><span>{evidence.summary}</span></button>)}{finding.evidence.length > 4 && <small>+ {finding.evidence.length - 4} matching locations in this file</small>}</div>
          <div className="finding-impact"><strong>Import graph impact</strong><span>{affected.length} directly related or dependent module{affected.length === 1 ? '' : 's'} within 3 import hops</span><div>{affected.slice(0, 6).map((item) => <button key={item.id} onClick={() => onSelect(item.id)}>{item.path || item.name}</button>)}{affected.length > 6 && <small>+{affected.length - 6} more</small>}</div></div>
          <div className="finding-actions">{finding.status !== 'resolved' && <button className="button secondary" onClick={() => onStatus(finding.id, 'resolved')}><Check size={13} /> Resolve</button>}{finding.status !== 'suppressed' && <button className="text-button" onClick={() => onStatus(finding.id, 'suppressed')}>Suppress</button>}{finding.status !== 'open' && <button className="text-button" onClick={() => onStatus(finding.id, 'open')}>Reopen</button>}</div>
        </article>
      })}{!shown.length && <div className="no-diff-state">No findings match this filter.</div>}{visible.length > shown.length && <div className="tree-limit-note">Showing {shown.length} of {visible.length} findings. Narrow the filter to inspect more.</div>}</div>
    </section>}
  </div>
}

function ImportReviewView({ result, previous, current, baseline, applyAdditions, applyUpdates, removeDeleted, setApplyAdditions, setApplyUpdates, setRemoveDeleted, onApply, onDiscard }: {
  result: PendingRepositoryImport
  previous?: RepositorySnapshot
  current: ArchitectureModel
  baseline: ArchitectureModel
  applyAdditions: boolean
  applyUpdates: boolean
  removeDeleted: boolean
  setApplyAdditions: (value: boolean) => void
  setApplyUpdates: (value: boolean) => void
  setRemoveDeleted: (value: boolean) => void
  onApply: () => void
  onDiscard: () => void
}) {
  const oldFiles = new Map((previous?.files ?? []).map((file) => [file.path, file]))
  const newFiles = new Map(result.snapshot.files.map((file) => [file.path, file]))
  const baselineElements = new Map(baseline.elements.map((element) => [element.id, element]))
  const addedFiles = result.snapshot.files.filter((file) => !oldFiles.has(file.path))
  const removedFiles = (previous?.files ?? []).filter((file) => !newFiles.has(file.path))
  const changedFiles = result.snapshot.files.filter((file) => oldFiles.has(file.path) && oldFiles.get(file.path)?.hash && file.hash && oldFiles.get(file.path)?.hash !== file.hash)
  const currentIds = new Set(current.elements.map((element) => element.id))
  const incomingIds = new Set(result.model.elements.map((element) => element.id))
  const newElements = result.model.elements.filter((element) => !currentIds.has(element.id))
  const oldSourceElementsMissing = baseline.elements.filter((element) => element.source && !incomingIds.has(element.id))
  const changedFacts = result.model.elements.filter((element) => {
    const old = baselineElements.get(element.id)
    return old && old.source && old.source.contentHash !== element.source?.contentHash
  })
  const changedFileNames = changedFiles.slice(0, 8).map((file) => file.path)
  const defaultIgnoreCount = result.snapshot.profile.excludedSecretFiles
  return <div className="page-view import-review-page">
    <div className="view-heading"><div><div className="eyebrow">LOCAL IMPORT REVIEW <span className="eyebrow-dot" /> {previous ? 'RE-IMPORT DIFF' : 'NEW SNAPSHOT'}</div><h1>Review repository analysis</h1><p>Inspect the local scan and choose how it updates this project model.</p></div><div className="heading-actions"><button className="button secondary" onClick={onDiscard}><X size={14} /> Discard scan</button><button className="button primary" onClick={onApply}><Check size={15} /> Apply reviewed import</button></div></div>
    <div className="privacy-banner"><span className="privacy-shield">●</span><div><strong>Source stayed on this device</strong><span>Analysis ran in a local Web Worker. Source text was used transiently and is not included in the saved snapshot or project bundle.</span></div><span className="privacy-stat">{(result.summary.sourceBytes / (1024 * 1024)).toFixed(1)} MiB parsed</span></div>
    <div className="analysis-summary-grid"><SummaryTile value={result.summary.files.toLocaleString()} label="Files inventoried" detail={`${result.summary.parsedFiles.toLocaleString()} parsed locally`} /><SummaryTile value={result.summary.imports.toLocaleString()} label="Resolved local imports" detail="Static module references" /><SummaryTile value={result.summary.symbols.toLocaleString()} label="Exported symbols" detail="Functions, classes, types" /><SummaryTile value={result.summary.routes.toLocaleString()} label="Next.js routes" detail={`${result.summary.packages} packages found`} /></div>
    <div className="import-review-grid"><section className="repository-card import-diff-card"><div className="repository-top"><div><ArrowLeftRight size={16} /><strong>{previous ? 'Re-import changes' : 'Snapshot contents'}</strong><span>{result.snapshot.rootName}</span></div><span className="analysis-version">{result.snapshot.analyzerVersion}</span></div>
      <div className="diff-summary-line"><span className="diff-added">+ {addedFiles.length} added paths</span><span className="diff-changed">~ {changedFiles.length} changed paths</span><span className="diff-removed">− {removedFiles.length} removed paths</span><span>{result.snapshot.findings?.length ?? 0} review findings</span><span>{result.snapshot.warnings.length} notes</span></div>
      <div className="file-diff-list">{changedFileNames.map((path) => <div key={path} className="file-diff-row"><FileCode2 size={14} /><code>{path}</code><span className="diff-changed">Changed</span></div>)}{addedFiles.slice(0, 8).map((file) => <div key={file.path} className="file-diff-row"><FileCode2 size={14} /><code>{file.path}</code><span className="diff-added">Added</span></div>)}{removedFiles.slice(0, 8).map((file) => <div key={file.path} className="file-diff-row"><FileCode2 size={14} /><code>{file.path}</code><span className="diff-removed">Removed</span></div>)}{!addedFiles.length && !changedFiles.length && !removedFiles.length && <div className="no-diff-state"><Check size={15} /> The selected repository matches the previous file inventory.</div>}{addedFiles.length + changedFiles.length + removedFiles.length > 24 && <div className="more-files-note">Showing the first paths in each group. The complete inventory will be stored with this snapshot.</div>}</div>
      {result.snapshot.warnings.length > 0 && <details className="analysis-warnings"><summary><Activity size={14} /> Analysis notes ({result.snapshot.warnings.length})</summary><div>{result.snapshot.warnings.slice(0, 30).map((warning, index) => <p key={`${warning.path}-${warning.code}-${index}`}><strong>{warning.code}</strong>{warning.path && <code>{warning.path}</code>}<span>{warning.message}</span></p>)}{result.snapshot.warnings.length > 30 && <small>Only the first 30 notes are shown here.</small>}</div></details>}
    </section>
    <aside className="import-review-options"><div className="plan-side-card"><span className="eyebrow">APPLY POLICY</span><h3>Merge into the active scenario</h3><p>Observed source facts are added to the immutable baseline. Manual scenario elements, flows, and changed source-backed scenario records are preserved.</p>
      <label className="import-choice"><input type="checkbox" checked={applyAdditions} onChange={(event) => setApplyAdditions(event.target.checked)} /><span><strong>Add newly detected facts</strong><small>{newElements.length} elements are new to the active scenario.</small></span></label>
      <label className="import-choice"><input type="checkbox" checked={applyUpdates} onChange={(event) => setApplyUpdates(event.target.checked)} /><span><strong>Refresh unchanged source facts</strong><small>{changedFacts.length} existing source facts have new evidence hashes. User-edited facts are retained.</small></span></label>
      <label className="import-choice caution"><input type="checkbox" checked={removeDeleted} onChange={(event) => setRemoveDeleted(event.target.checked)} /><span><strong>Remove missing source facts</strong><small>{oldSourceElementsMissing.length} previous source records are absent from this scan. This is off by default.</small></span></label>
      <div className="import-policy-foot">{defaultIgnoreCount} secret-like files were excluded without reading. Dependencies, build output, and VCS folders were skipped by default.</div>
    </div><div className="plan-side-card"><span className="eyebrow">PROJECT PROFILE</span><h3>{result.snapshot.frameworks.join(', ') || 'No known framework detected'}</h3><p>{result.snapshot.packageManager ? `Package manager: ${result.snapshot.packageManager}. ` : ''}Fingerprint <code>{result.snapshot.fingerprint.slice(0, 16)}</code></p><span className="privacy-note"><span className="status-led" /> Local-only analysis</span></div></aside></div>
  </div>
}

function SummaryTile({ value, label, detail }: { value: string; label: string; detail: string }) { return <div className="summary-tile"><strong>{value}</strong><span>{label}</span><small>{detail}</small></div> }

function FlowsView({ flows, elements, onAdd, onAddStep, onUpdateStep, onUpdateFlow }: { flows: Flow[]; elements: Element[]; onAdd: () => void; onAddStep: (flowId: string) => void; onUpdateStep: (flowId: string, stepId: string, patch: Partial<Flow['steps'][number]>) => void; onUpdateFlow: (flowId: string, patch: Partial<Flow>) => void }) {
  const [activeFlowId, setActiveFlowId] = useState(flows[0]?.id ?? '')
  const [cursor, setCursor] = useState<string | null>(null)
  const [preset, setPreset] = useState<SimulationPreset>('cold-online')
  const [simulation, setSimulation] = useState<SimulationState | null>(null)
  const [lastChanges, setLastChanges] = useState<{ label: string; before: string; after: string }[]>([])
  const [branchChoice, setBranchChoice] = useState('')
  useEffect(() => { if (!flows.some((flow) => flow.id === activeFlowId)) setActiveFlowId(flows[0]?.id ?? '') }, [flows, activeFlowId])
  const flow = flows.find((item) => item.id === activeFlowId)
  const current = flow?.steps.find((step) => step.id === cursor) ?? flow?.steps.find((step) => step.id === flow.entryStepId)
  const simulatedStep = flow && simulation ? flow.steps.find((step) => step.id === simulation.currentStepId) : undefined
  useEffect(() => { if (flow) { setSimulation(createSimulation(flow, preset)); setLastChanges([]); setBranchChoice('') } }, [flow?.id, flow?.entryStepId, preset])
  const runSimulationStep = (override?: string) => {
    if (!flow || !simulation) return
    const transition = advanceSimulation(flow, simulation, override)
    setSimulation(transition.state)
    setLastChanges(simulationDiff(transition.before, transition.state))
    setBranchChoice('')
  }
  const runSimulationToEnd = () => {
    if (!flow || !simulation) return
    let state = simulation
    let changes: { label: string; before: string; after: string }[] = []
    for (let count = 0; count < 100 && !state.done; count++) {
      const transition = advanceSimulation(flow, state, count === 0 ? branchChoice || undefined : undefined)
      state = transition.state
      changes = [...changes, ...simulationDiff(transition.before, transition.state)]
    }
    setSimulation(state); setLastChanges(changes.slice(-20)); setBranchChoice('')
  }
  return <div className="page-view"><div className="view-heading"><div><div className="eyebrow">BEHAVIOR MODEL <span className="eyebrow-dot" /> {flows.length} FLOWS</div><h1>Flows and interactions</h1><p>Trace a user action through the components, state, and data it touches.</p></div><button className="button primary" onClick={onAdd}><Plus size={15} /> Create flow</button></div>
    {flows.length ? <div className="flow-layout"><section className="flow-list-card"><div className="card-label">PROJECT FLOWS</div>{flows.map((item) => <button key={item.id} className={`flow-list-item ${item.id === flow?.id ? 'active' : ''}`} onClick={() => { setActiveFlowId(item.id); setCursor(null) }}><span className="flow-mini-icon"><Workflow size={16} /></span><span><strong>{item.name}</strong><small>{item.steps.length} steps · {item.trigger}</small></span><ChevronRight size={15} /></button>)}<div className="flow-list-bottom"><span>Flow order is editable in the model.</span></div></section>
      {flow && <section className="flow-editor"><div className="flow-editor-head"><div><span className="eyebrow">FLOW PLAYER</span><input className="flow-name-input" aria-label="Flow name" value={flow.name} onChange={(event) => onUpdateFlow(flow.id, { name: event.target.value })} /><div className="trigger-edit"><span>Triggered by</span><input aria-label="Flow trigger" value={flow.trigger} onChange={(event) => onUpdateFlow(flow.id, { trigger: event.target.value })} /></div></div><button className="button secondary" onClick={() => onAddStep(flow.id)}><Plus size={14} /> Add step</button></div>
        <div className="flow-progress"><span>STEP {Math.max(1, flow.steps.findIndex((step) => step.id === current?.id) + 1)} OF {flow.steps.length}</span><div><i style={{ width: `${Math.max(8, (Math.max(1, flow.steps.findIndex((step) => step.id === current?.id) + 1) / flow.steps.length) * 100)}%` }} /></div><button className="text-button" onClick={() => setCursor(flow.entryStepId)}>Reset</button></div>
        <div className="flow-step-focus"><div className="step-number">{Math.max(1, flow.steps.findIndex((step) => step.id === current?.id) + 1).toString().padStart(2, '0')}</div><div className="step-content"><label className="eyebrow">CURRENT STEP</label><input className="step-title-input" value={current?.title ?? ''} onChange={(event) => current && onUpdateStep(flow.id, current.id, { title: event.target.value })} /><textarea value={current?.detail ?? ''} rows={2} onChange={(event) => current && onUpdateStep(flow.id, current.id, { detail: event.target.value })} />
          <label className="field-label" htmlFor="flow-element">Linked architecture element</label><select id="flow-element" value={current?.elementId ?? ''} onChange={(event) => current && onUpdateStep(flow.id, current.id, { elementId: event.target.value || undefined })}><option value="">No linked element</option>{elements.map((element) => <option key={element.id} value={element.id}>{element.name}</option>)}</select>
          <div className="branch-options"><span className="field-label">Continue to</span>{current?.next.map((nextId, index) => { const next = flow.steps.find((step) => step.id === nextId); return next ? <div key={nextId} className="branch-row"><button className="branch-button" onClick={() => setCursor(nextId)}><span>{next.branchLabel || (current.next.length > 1 ? `Option ${String.fromCharCode(65 + index)}` : 'Next step')}</span><strong>{next.title}</strong><ArrowRight size={15} /></button><input className="branch-label-input" aria-label={`Label for ${next.title}`} placeholder="Outcome label" value={next.branchLabel ?? ''} onChange={(event) => onUpdateStep(flow.id, next.id, { branchLabel: event.target.value })} /></div> : null })}{current && <select className="add-outcome" aria-label="Add a flow outcome" value="" onChange={(event) => { if (event.target.value) onUpdateStep(flow.id, current.id, { next: [...current.next, event.target.value] }) }}><option value="">+ Connect an outcome to another step…</option>{flow.steps.filter((step) => step.id !== current.id && !current.next.includes(step.id)).map((step) => <option key={step.id} value={step.id}>{step.title}</option>)}</select>}</div>
        </div></div>
        {current && <div className="step-simulation-config"><label className="eyebrow" htmlFor="step-action">DETERMINISTIC MODEL ACTION</label><select id="step-action" value={current.action ?? 'note'} onChange={(event) => onUpdateStep(flow.id, current.id, { action: event.target.value as NonNullable<Flow['steps'][number]['action']> })}><option value="note">No state change · note</option><option value="read-cache">Read cache</option><option value="read-database">Read database</option><option value="write-cache">Write cache</option><option value="write-database">Write database</option><option value="invalidate-cache">Invalidate cache key</option><option value="set-offline">Set network offline</option><option value="set-online">Set network online</option><option value="sync-queue">Synchronize offline queue</option><option value="fail">Inject a modeled failure</option></select>{current.action && !['note', 'set-offline', 'set-online', 'sync-queue', 'fail'].includes(current.action) && <div className="simulation-action-fields"><input aria-label="Simulation state key" value={current.stateKey ?? ''} placeholder="State key (default product:42)" onChange={(event) => onUpdateStep(flow.id, current.id, { stateKey: event.target.value })} />{['write-cache', 'write-database'].includes(current.action) && <input aria-label="Simulation state value" value={current.stateValue ?? ''} placeholder="Value (default product-v2)" onChange={(event) => onUpdateStep(flow.id, current.id, { stateValue: event.target.value })} />}</div>}<p>Actions change only the rehearsal’s local model state. They never call services or run repository code.</p></div>}
        <section className="simulation-panel"><div className="simulation-heading"><div><span className="eyebrow">DETERMINISTIC REHEARSAL</span><h3>{simulatedStep ? simulatedStep.title : 'Flow complete'}</h3><p>Model-only transitions · no random timing or external calls</p></div><div className="simulation-controls"><select aria-label="Initial simulation state" value={preset} onChange={(event) => setPreset(event.target.value as SimulationPreset)}><option value="cold-online">Cold cache · online</option><option value="warm-online">Warm cache · online</option><option value="cache-failure">Cache unavailable</option><option value="database-failure">Database unavailable</option><option value="offline">Offline · empty cache</option></select><button className="button secondary" onClick={() => { if (flow) { setSimulation(createSimulation(flow, preset)); setLastChanges([]) } }}>Reset</button></div></div>
          {!!simulatedStep?.next.length && <label className="simulation-branch">Choose modeled outcome<select value={branchChoice} onChange={(event) => setBranchChoice(event.target.value)}><option value="">Use state result / first matching branch</option>{simulatedStep.next.map((nextId) => { const next = flow.steps.find((step) => step.id === nextId); return next && <option key={next.id} value={next.id}>{next.branchLabel || next.title} → {next.title}</option> })}</select></label>}
          <div className="simulation-buttons"><button className="button primary" disabled={!simulation || simulation.done} onClick={() => runSimulationStep(branchChoice || undefined)}><ArrowRight size={14} /> Advance one modeled step</button><button className="button secondary" disabled={!simulation || simulation.done} onClick={runSimulationToEnd}>Run up to 100 steps</button></div>
          {simulation && <div className="simulation-state-grid"><div><strong>Network</strong><span>{simulation.online ? 'Online' : 'Offline'}</span></div><div><strong>Cache</strong><span>{!simulation.cacheAvailable ? 'Unavailable' : Object.keys(simulation.cache).length ? Object.entries(simulation.cache).map(([key, value]) => `${key}=${value}`).join(', ') : 'Empty'}</span></div><div><strong>Database</strong><span>{simulation.databaseAvailable ? Object.entries(simulation.database).map(([key, value]) => `${key}=${value}`).join(', ') || 'Empty' : 'Unavailable'}</span></div><div><strong>Offline queue</strong><span>{simulation.queue.length ? simulation.queue.map((item) => `${item.key}=${item.value}`).join(', ') : 'Empty'}</span></div><div><strong>Latest read result</strong><span>{simulation.result ?? '—'}</span></div></div>}
          {lastChanges.length > 0 && <div className="simulation-diff"><strong>Last state diff</strong>{lastChanges.slice(0, 8).map((change, index) => <span key={`${change.label}-${index}`}>{change.label}: <code>{change.before}</code> → <code>{change.after}</code></span>)}</div>}
          {simulation?.trace.length ? <ol className="simulation-trace">{simulation.trace.slice(-8).map((item, index) => <li key={`${item.stepId}-${index}`}><span>{item.outcome}</span><strong>{item.title}</strong><small>{item.summary}</small></li>)}</ol> : null}
        </section>
        <div className="flow-timeline"><span className="eyebrow">FLOW STEPS</span>{flow.steps.map((step, index) => <button key={step.id} className={`timeline-step ${step.id === current?.id ? 'active' : ''}`} onClick={() => setCursor(step.id)}><span className="timeline-index">{String(index + 1).padStart(2, '0')}</span><span>{step.title}</span>{step.action && <span className="timeline-linked">{step.action}</span>}{step.elementId && <span className="timeline-linked">{elements.find((element) => element.id === step.elementId)?.name}</span>}</button>)}</div>
      </section>}</div> : <div className="empty-state flow-empty"><div className="empty-icon"><Workflow size={24} /></div><h3>Give the system a behavior</h3><p>Flows connect architecture elements into a sequence you can inspect and rehearse.</p><button className="button primary" onClick={onAdd}><Plus size={15} /> Create your first flow</button></div>}
  </div>
}

function PlanView({ project, scenario, model, onExport, onAddDecision, onUpdateDecision, onRemoveDecision, onExportProject, onImportProject }: { project: Project; scenario: Project['scenarios'][number]; model: ArchitectureModel; onExport: () => void; onAddDecision: (values: Pick<PlanningDecision, 'kind' | 'title' | 'detail'>) => void; onUpdateDecision: (id: string, patch: Partial<PlanningDecision>) => void; onRemoveDecision: (id: string) => void; onExportProject: () => void; onImportProject: () => void }) {
  const [compareId, setCompareId] = useState('baseline')
  const [decisionKind, setDecisionKind] = useState<PlanningDecision['kind']>('decision')
  const [decisionTitle, setDecisionTitle] = useState('')
  const [decisionDetail, setDecisionDetail] = useState('')
  const proposed = model.elements.filter((element) => element.status === 'proposed')
  const compareScenario = project.scenarios.find((item) => item.id === compareId && item.id !== scenario.id)
  const compareModel = compareId === 'baseline' || !compareScenario ? project.baseline : compareScenario.model
  const compareName = compareId === 'baseline' || !compareScenario ? 'Project baseline' : compareScenario.name
  const comparison = compareModels(model, compareModel)
  const tests = generatedValidationCases(model)
  const rollout = generatedRolloutSteps(project, model)
  const decisions = project.decisions ?? []
  useEffect(() => { if (compareId !== 'baseline' && compareId === scenario.id) setCompareId('baseline') }, [compareId, scenario.id])
  const addDecision = (event: FormEvent) => {
    event.preventDefault()
    if (!decisionTitle.trim()) return
    onAddDecision({ kind: decisionKind, title: decisionTitle.trim(), detail: decisionDetail.trim() })
    setDecisionTitle(''); setDecisionDetail('')
  }
  const counts = { added: comparison.filter((item) => item.status === 'added').length, removed: comparison.filter((item) => item.status === 'removed').length, changed: comparison.filter((item) => item.status === 'changed').length }
  return <div className="page-view plan-page mature-plan-page"><div className="view-heading"><div><div className="eyebrow">SCENARIO OUTPUT <span className="eyebrow-dot" /> IMPLEMENTATION READY</div><h1>Change plan</h1><p>Compare scenarios, record decisions, and generate validation and rollout guidance.</p></div><div className="heading-actions"><button className="button secondary" onClick={onImportProject}><Upload size={14} /> Import bundle</button><button className="button secondary" onClick={onExportProject}><Download size={14} /> Export project</button><button className="button primary" onClick={onExport}><Download size={15} /> Export plan</button></div></div>
    <section className="scenario-compare-card"><div className="scenario-compare-heading"><div><span className="eyebrow">ROBUST SCENARIO COMPARE</span><h2>{scenario.name} <span>vs</span> {compareName}</h2></div><label>Compare against<select aria-label="Compare against baseline or scenario" value={compareId} onChange={(event) => setCompareId(event.target.value)}><option value="baseline">Project baseline</option>{project.scenarios.filter((item) => item.id !== scenario.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><div className="compare-counts"><span className="diff-added"><strong>+{counts.added}</strong> added</span><span className="diff-removed"><strong>−{counts.removed}</strong> removed</span><span className="diff-changed"><strong>~{counts.changed}</strong> changed</span><span>{comparison.length} total differences</span></div><div className="compare-diff-list">{comparison.slice(0, 60).map((item, index) => <div key={`${item.type}-${item.status}-${item.name}-${index}`}><span className={`compare-change-status ${item.status}`}>{item.status}</span><span className="compare-change-type">{item.type}</span><strong>{item.name}</strong><small>{item.detail}</small></div>)}{!comparison.length && <div className="no-diff-state"><Check size={14} /> These models match across elements, relationships, and flows.</div>}{comparison.length > 60 && <small>Showing 60 of {comparison.length} differences.</small>}</div></section>
    <section className="decision-panel"><div className="decision-panel-heading"><div><span className="eyebrow">DECISIONS & ASSUMPTIONS</span><h2>Keep the reasoning with the scenario</h2></div><span>{decisions.filter((item) => item.status === 'open').length} open</span></div><form className="decision-form" onSubmit={addDecision}><select aria-label="Record type" value={decisionKind} onChange={(event) => setDecisionKind(event.target.value as PlanningDecision['kind'])}><option value="decision">Decision</option><option value="assumption">Assumption</option></select><input required value={decisionTitle} onChange={(event) => setDecisionTitle(event.target.value)} placeholder="Short title" aria-label="Decision or assumption title" /><textarea value={decisionDetail} onChange={(event) => setDecisionDetail(event.target.value)} placeholder="Context, evidence, or rationale" aria-label="Decision or assumption details" rows={2} /><button className="button primary" disabled={!decisionTitle.trim()}><Plus size={14} /> Record</button></form><div className="decision-list">{decisions.map((item) => <article key={item.id}><span className="decision-kind">{item.kind}</span><input value={item.title} aria-label="Decision title" onChange={(event) => onUpdateDecision(item.id, { title: event.target.value })} /><select value={item.status} aria-label="Decision status" onChange={(event) => onUpdateDecision(item.id, { status: event.target.value as PlanningDecision['status'] })}><option value="open">Open</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select><button className="icon-button" title="Remove decision" onClick={() => onRemoveDecision(item.id)}><Trash2 size={14} /></button><textarea value={item.detail} aria-label="Decision details" rows={2} onChange={(event) => onUpdateDecision(item.id, { detail: event.target.value })} /></article>)}{!decisions.length && <p className="md-muted">No decisions yet. Record a choice or assumption and it will travel with project exports and the implementation plan.</p>}</div></section>
    <div className="mature-plan-grid"><article className="plan-document"><div className="document-top"><span className="document-icon"><FileCode2 size={16} /></span><span><strong>{slug(scenario.name)}-change-plan.md</strong><small>Preview · scenario, decisions, tests, rollout</small></span><button className="icon-button" onClick={onExport} title="Export Markdown plan"><Download size={15} /></button></div><div className="mature-plan-document"><div className="md-kicker">IMPLEMENTATION PLAN · {project.name.toUpperCase()}</div><h2>{scenario.name}</h2><p className="md-lead">{scenario.description || 'An architecture change proposal ready for decisions and implementation detail.'}</p><h3>Proposed architecture</h3>{proposed.length ? <ul>{proposed.map((element) => <li key={element.id}><strong>{element.name}</strong> <span className="status-pill proposed">Proposed</span><p>{element.description || 'Responsibility needs description.'}</p></li>)}</ul> : <p className="md-muted">No proposed elements yet.</p>}<h3>Flows and generated validation cases</h3>{tests.length ? <ul className="generated-check-list">{tests.map((item, index) => <li key={`${item}-${index}`}><i className="generated-case-mark">TEST</i><span>{item}</span></li>)}</ul> : <p className="md-muted">Add flows and model actions to generate validation cases.</p>}<h3>Suggested rollout and rollback</h3><ol>{rollout.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol><h3>Recorded decisions</h3>{decisions.length ? <ul>{decisions.map((item) => <li key={item.id}><strong>{item.kind} · {item.status}: {item.title}</strong><p>{item.detail}</p></li>)}</ul> : <p className="md-muted">No decisions or assumptions recorded.</p>}</div></article>
      <aside className="plan-sidebar"><div className="plan-side-card"><span className="eyebrow">SCENARIO SUMMARY</span><div className="summary-value">{model.elements.length}<small> elements</small></div><div className="summary-stats"><span>{model.relationships.length} relationships</span><span>{model.flows.length} modeled flows</span><span>{proposed.length} proposed elements</span><span>{tests.length} generated validation cases</span></div></div><div className="plan-side-card"><span className="eyebrow">PROJECT BUNDLE</span><h3>Portable local project</h3><p>Export this project with its scenarios, baselines, repository findings, and decisions, or import a project bundle into the current workspace.</p><div className="bundle-actions"><button className="button secondary" onClick={onExportProject}><Download size={13} /> Export project</button><button className="text-button" onClick={onImportProject}><Upload size={13} /> Import project</button></div></div><div className="plan-side-card"><span className="eyebrow">REHEARSAL BOUNDARY</span><h3>Model-based outcomes</h3><p>Generated validation cases describe modeled behavior. They are implementation prompts and do not replace integration tests against real dependencies.</p><span className="privacy-note"><span className="status-led" /> Stored on this device</span></div></aside></div>
  </div>
}


function ModalHost({ type, elements, onClose, onElement, onRelationship, onFlow, onProject, onProjectAndImport, onScenario, onImport, onChooseRepository }: { type: Exclude<Modal, null>; elements: Element[]; onClose: () => void; onElement: (values: Pick<Element, 'name' | 'kind' | 'description' | 'path'>) => void; onRelationship: (fromId: string, toId: string, kind: Relationship['kind'], label: string) => void; onFlow: (name: string) => void; onProject: (name: string) => void; onProjectAndImport: (name: string) => void; onScenario: (name: string, description: string) => void; onImport: () => void; onChooseRepository: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [path, setPath] = useState('')
  const [kind, setKind] = useState<Element['kind']>('service')
  const [fromId, setFromId] = useState(elements[0]?.id ?? '')
  const [toId, setToId] = useState(elements[1]?.id ?? '')
  const [relation, setRelation] = useState<Relationship['kind']>('depends-on')
  const [label, setLabel] = useState('')
  const title = ({ element: 'Add architecture element', relationship: 'Create relationship', flow: 'Create a flow', project: 'New project', scenario: 'Branch a scenario', import: 'Import local bundle', repository: 'Import local repository' } as const)[type]
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (type === 'element') onElement({ name: name.trim(), kind, description, path })
    if (type === 'relationship') onRelationship(fromId, toId, relation, label)
    if (type === 'flow') onFlow(name.trim())
    if (type === 'project') onProject(name.trim())
    if (type === 'scenario') onScenario(name.trim(), description)
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal-card"><div className="modal-top"><div><span className="eyebrow">ARCHITECTURE LAB</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose}><X size={17} /></button></div>
    {type === 'repository' ? <><p className="modal-copy">Select a repository folder to build a local, read-only architecture snapshot. Source files are analyzed in your browser and are not uploaded or copied into the project bundle.</p><div className="import-consent-list"><span><Check size={14} /> Reads TypeScript, JavaScript, JSON assets, package manifests, and project config</span><span><Check size={14} /> Skips .git, node_modules, build output, and secret-like files without reading their contents</span><span><Check size={14} /> Stores paths, hashes, graph facts, and evidence lines; no source text</span><span><Activity size={14} /> Limits: 12,000 eligible files, 120 MiB total source text, and 2 MiB per file</span></div><button className="button primary modal-submit" onClick={onChooseRepository}><FolderTree size={15} /> Choose repository folder</button></> : type === 'import' ? <><p className="modal-copy">Choose an Architecture Lab workspace bundle to restore a workspace or a project bundle to add that project to your current workspace. Bundles are validated locally before import.</p><button className="button primary modal-submit" onClick={onImport}><Upload size={15} /> Choose bundle</button></> : <form onSubmit={submit}>
      {type === 'element' && <><div className="field"><label htmlFor="new-element-name">Element name</label><input id="new-element-name" required autoFocus placeholder="e.g. Product cache" value={name} onChange={(event) => setName(event.target.value)} /></div><div className="field"><label htmlFor="new-element-kind">Element type</label><select id="new-element-kind" value={kind} onChange={(event) => setKind(event.target.value as Element['kind'])}>{elementKinds.map((item) => <option key={item} value={item}>{kindLabel(item)}</option>)}</select></div><div className="field"><label htmlFor="new-element-description">Responsibility</label><textarea id="new-element-description" rows={2} placeholder="What does it own?" value={description} onChange={(event) => setDescription(event.target.value)} /></div><div className="field"><label htmlFor="new-element-path">Repository path <span className="optional">optional</span></label><input id="new-element-path" placeholder="src/features/..." value={path} onChange={(event) => setPath(event.target.value)} /></div></>}
      {type === 'relationship' && <>{elements.length < 2 ? <p className="modal-copy">Add at least two architecture elements before creating a relationship.</p> : <><div className="field"><label htmlFor="relation-from">From</label><select id="relation-from" value={fromId} onChange={(event) => setFromId(event.target.value)}>{elements.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="field"><label htmlFor="relation-kind">Relationship type</label><select id="relation-kind" value={relation} onChange={(event) => setRelation(event.target.value as Relationship['kind'])}>{relationshipKinds.map((item) => <option key={item} value={item}>{kindLabel(item)}</option>)}</select></div><div className="field"><label htmlFor="relation-to">To</label><select id="relation-to" value={toId} onChange={(event) => setToId(event.target.value)}>{elements.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="field"><label htmlFor="relation-label">Label <span className="optional">optional</span></label><input id="relation-label" placeholder="e.g. cache miss" value={label} onChange={(event) => setLabel(event.target.value)} /></div></>}</>}
      {(type === 'flow' || type === 'project' || type === 'scenario') && <><div className="field"><label htmlFor="name-field">{type === 'flow' ? 'Flow name' : type === 'project' ? 'Project name' : 'Scenario name'}</label><input id="name-field" autoFocus required placeholder={type === 'flow' ? 'e.g. Product detail load' : type === 'project' ? 'e.g. Commerce platform' : 'e.g. Event-driven invalidation'} value={name} onChange={(event) => setName(event.target.value)} /></div>{type !== 'flow' && <div className="field"><label htmlFor="description-field">{type === 'scenario' ? 'What are you exploring?' : 'Project description'} <span className="optional">optional</span></label><textarea id="description-field" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A short note to preserve context." /></div>}{type === 'scenario' && <p className="modal-note"><GitBranch size={14} /> The current model is copied into this branch. Its edits stay separate from other scenarios.</p>}</>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button>{type === 'project' && <button type="button" className="button secondary" disabled={!name.trim()} onClick={() => onProjectAndImport(name.trim())}><FolderTree size={14} /> Create & import</button>}<button className="button primary" disabled={(type === 'relationship' && elements.length < 2) || ((type === 'project' || type === 'scenario' || type === 'flow') && !name.trim())}>{type === 'element' ? <Plus size={15} /> : type === 'relationship' ? <Link2 size={15} /> : type === 'scenario' ? <GitBranch size={15} /> : <Check size={15} />}{type === 'scenario' ? 'Create branch' : type === 'relationship' ? 'Add relationship' : type === 'element' ? 'Add element' : type === 'project' ? 'Create project' : 'Create flow'}</button></div>
    </form>}
  </div></div>
}

function CommandPalette({ query, setQuery, onClose, onAction, actions }: { query: string; setQuery: (value: string) => void; onClose: () => void; onAction: (action: () => void) => void; actions: { label: string; hint: string; icon: LucideIcon; run: () => void }[] }) {
  const filtered = actions.filter((action) => `${action.label} ${action.hint}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="modal-backdrop command-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="command-palette"><div className="command-search"><Search size={18} /><input autoFocus placeholder="Search commands and actions…" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') onClose(); if (event.key === 'Enter' && filtered[0]) onAction(filtered[0].run) }} /><kbd>ESC</kbd></div><div className="command-list"><div className="card-label">SUGGESTED ACTIONS</div>{filtered.map((action) => <button key={action.label} className="command-option" onClick={() => onAction(action.run)}><span className="command-option-icon"><action.icon size={16} /></span><span><strong>{action.label}</strong><small>{action.hint}</small></span><ArrowRight size={15} /></button>)}{!filtered.length && <div className="no-commands">No matching commands.</div>}</div><div className="command-footer"><span><kbd>↵</kbd> Select</span><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>esc</kbd> Close</span></div></div></div>
}

export default App
