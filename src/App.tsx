import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent } from 'react'
import { Activity, ArrowLeftRight, ArrowRight, ArrowUpRight, Boxes, Check, ChevronDown, ChevronRight, CircleHelp, Command, Download, FileCode2, FolderTree, GitBranch, Layers2, Link2, MoreHorizontal, Network, PanelRightClose, PanelRightOpen, Plus, Search, Settings2, Sparkles, Workflow, X, Undo2, Redo2, Trash2, Upload, type LucideIcon } from 'lucide-react'
import { activeScenario, clone, elementKinds, makeProject, makeStarterProject, relationshipKinds, uid, validateWorkspace, type ArchitectureModel, type Element, type Flow, type Project, type Relationship, type Workspace } from './domain'
import { loadWorkspace, saveWorkspace } from './persistence'

type View = 'canvas' | 'repository' | 'flows' | 'plan'
type Modal = 'element' | 'flow' | 'relationship' | 'project' | 'scenario' | 'import' | null

const kindLabel = (kind: string) => kind.replaceAll('-', ' ')
const kindIcon = (kind: string): LucideIcon => ({ application: Boxes, package: Boxes, 'bounded-context': Layers2, folder: FolderTree, file: FileCode2, module: Boxes, function: Settings2, 'api-endpoint': ArrowLeftRight, database: Layers2, cache: Activity, queue: Workflow, 'browser-storage': Layers2, worker: Activity, 'external-system': ArrowUpRight, service: Network }[kind] ?? Boxes)

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
  const [history, setHistory] = useState<{ past: Workspace[]; future: Workspace[] }>({ past: [], future: [] })
  const importRef = useRef<HTMLInputElement>(null)
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
  const selected = model?.elements.find((element) => element.id === selectedId) ?? null
  const selectedFlow = model?.flows[0]
  const selectedRelationships = useMemo(() => model?.relationships.filter((edge) => edge.fromId === selectedId || edge.toId === selectedId) ?? [], [model, selectedId])

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

  const exportPlan = () => {
    if (!project || !scenario || !model) return
    const proposed = model.elements.filter((element) => element.status === 'proposed')
    const markdown = `# Change plan: ${scenario.name}\n\n## Goal\n${scenario.description || 'Describe the outcome this scenario should achieve.'}\n\n## Baseline and scope\n- Project: ${project.name}\n- Scenario: ${scenario.name}\n- Generated: ${new Date().toLocaleString()}\n- Model: manually declared and scenario-proposed architecture; no source repository has been imported.\n\n## Proposed architecture\n${proposed.length ? proposed.map((element) => `- **${element.name}** (${kindLabel(element.kind)})${element.path ? ` — \`${element.path}\`` : ''}: ${element.description || 'No description provided.'}`).join('\n') : '- No elements are marked as proposed.'}\n\n## Relationships\n${model.relationships.length ? model.relationships.map((edge) => `- ${model.elements.find((item) => item.id === edge.fromId)?.name ?? 'Unknown'} **${edge.kind}** ${model.elements.find((item) => item.id === edge.toId)?.name ?? 'Unknown'}${edge.label ? ` — ${edge.label}` : ''} [${edge.status}]`).join('\n') : '- No relationships have been modeled.'}\n\n## Flows\n${model.flows.length ? model.flows.map((flow) => `### ${flow.name}\nTrigger: ${flow.trigger}\n\n${flow.steps.map((step, index) => `${index + 1}. **${step.title}**${step.elementId ? ` — ${model.elements.find((element) => element.id === step.elementId)?.name ?? 'Unlinked element'}` : ''}: ${step.detail}`).join('\n')}`).join('\n\n') : 'No flows have been modeled.'}\n\n## Decisions and open questions\n- What consistency, error-handling, and ownership policies need an explicit decision?\n- Which tests should validate each modeled branch and failure path?\n- Which assumptions should be confirmed against implementation evidence?\n\n## Validation matrix\n| Case | Expected behavior | Test / evidence needed |\n| --- | --- | --- |\n| Primary success path | Confirm from the flow model | Add an implementation test |\n| Dependency failure | Define fallback or failure behavior | Add a failure-path test |\n`
    download(`${slug(scenario.name)}-change-plan.md`, markdown, 'text/markdown')
    setToast('Markdown change plan exported')
  }

  const exportBundle = () => {
    if (!workspace) return
    download('architecture-lab-projects.json', JSON.stringify(workspace, null, 2), 'application/json')
    setToast('Local workspace bundle exported')
  }

  const importBundle = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error('Project bundles must be smaller than 50 MB.')
      const parsed: unknown = JSON.parse(await file.text())
      if (!validateWorkspace(parsed)) throw new Error('This file is not a supported Architecture Lab bundle.')
      commit(() => parsed)
      setSelectedId(null); setModal(null); setToast('Workspace bundle imported')
    } catch (error) { setToast(error instanceof Error ? error.message : 'Could not read this project bundle') }
    event.currentTarget.value = ''
  }

  const download = (filename: string, body: string, type: string) => {
    const url = URL.createObjectURL(new Blob([body], { type }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url)
  }

  if (!hydrated || !workspace || !project || !scenario || !model) return <div className="loading"><div className="brand-mark">A</div><span>Opening your local workspace…</span></div>

  const filteredElements = model.elements.filter((element) => !searchQuery || `${element.name} ${element.kind} ${element.path} ${element.description}`.toLowerCase().includes(searchQuery.toLowerCase()))
  const statusLabel = saveState === 'saved' ? 'Saved locally' : saveState === 'saving' || saveState === 'loading' ? 'Saving locally…' : 'Local save needs attention'

  return <div className={`app-shell theme-${workspace.theme}`}>
    <aside className="rail">
      <button className="brand-mark" title="Architecture Lab" onClick={() => setView('canvas')}>A</button>
      <div className="rail-rule" />
      <NavButton active={view === 'canvas'} icon={Network} label="Architecture" onClick={() => setView('canvas')} />
      <NavButton active={view === 'repository'} icon={FolderTree} label="Repository" onClick={() => setView('repository')} />
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
        <div className="breadcrumbs"><ChevronRight size={14} /><span>{view === 'canvas' ? 'Architecture' : view === 'repository' ? 'Repository' : view === 'flows' ? 'Flows' : 'Planning'}</span><ChevronRight size={14} /><strong>{view === 'flows' ? selectedFlow?.name ?? 'No flows' : scenario.name}</strong></div>
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
            <div className="canvas-card" ref={canvasRef}>
              <div className="canvas-toolbar"><div className="canvas-view-tabs"><button className="canvas-tab active"><Network size={14} /> System map</button><button className="canvas-tab" onClick={() => setView('flows')}><Workflow size={14} /> Flow view</button></div><div className="canvas-tools">
                {searchOpen ? <div className="search-inline"><Search size={14} /><input id="global-search" placeholder="Search elements…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === 'Escape' && (setSearchQuery(''), setSearchOpen(false))} autoFocus /><button onClick={() => { setSearchQuery(''); setSearchOpen(false) }}><X size={13} /></button></div> : <button className="canvas-icon" title="Search elements (/)" onClick={() => setSearchOpen(true)}><Search size={16} /></button>}
                <button className="canvas-icon" title={inspectorOpen ? 'Hide inspector' : 'Show inspector'} onClick={() => setInspectorOpen((open) => !open)}>{inspectorOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}</button><button className="canvas-icon" title="More canvas actions" onClick={() => setModal('relationship')}><MoreHorizontal size={17} /></button>
              </div></div>
              <div className="canvas-stage" onPointerDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null) }}>
                <div className="canvas-grid" />
                <svg className="edge-layer" aria-label="Architecture relationships">
                  <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
                  {model.relationships.map((edge) => {
                    const from = model.elements.find((item) => item.id === edge.fromId), to = model.elements.find((item) => item.id === edge.toId)
                    if (!from || !to || !filteredElements.some((item) => item.id === from.id) || !filteredElements.some((item) => item.id === to.id)) return null
                    const sx = from.x + 100, sy = from.y + 45, ex = to.x + 100, ey = to.y + 45, bend = Math.max(35, Math.abs(ex - sx) * .32)
                    const path = `M ${sx} ${sy} C ${sx + bend} ${sy}, ${ex - bend} ${ey}, ${ex} ${ey}`
                    return <g key={edge.id} className={`edge ${edge.status} ${selectedId === edge.fromId || selectedId === edge.toId ? 'edge-active' : ''}`}><path d={path} markerEnd="url(#arrow)" /><text x={(sx + ex) / 2} y={(sy + ey) / 2 - 7}>{edge.label || edge.kind}</text></g>
                  })}
                </svg>
                {filteredElements.map((element) => <ArchitectureNode key={element.id} element={element} selected={selectedId === element.id} onSelect={() => setSelectedId(element.id)} onMove={(x, y) => updateElement(element.id, { x, y })} container={canvasRef.current} />)}
                {!model.elements.length && <div className="empty-canvas"><div className="empty-icon"><Network size={24} /></div><h3>Start with the system shape</h3><p>Add an application, a data store, or the responsibility you want to change.</p><button className="button primary" onClick={() => setModal('element')}><Plus size={15} /> Add your first element</button></div>}
                <div className="canvas-legend"><span><i className="legend-dot declared" /> Declared</span><span><i className="legend-dot proposed" /> Proposed</span><span><i className="legend-line" /> Relationship</span></div>
              </div>
              <div className="canvas-footer"><span><span className="live-dot" /> Local model</span><span>{model.elements.length} elements <i /> {model.relationships.length} relationships <i /> {model.flows.length} flows</span><span>Drag to arrange <kbd>⌘ K</kbd> commands</span></div>
            </div>
            {inspectorOpen && <Inspector element={selected} edges={selectedRelationships} model={model} onUpdate={updateElement} onDelete={removeElement} onAddRelationship={() => setModal('relationship')} />}
          </div>
        </>}

        {view === 'repository' && <RepositoryView model={model} onAdd={() => setModal('element')} onSelect={(id) => { setSelectedId(id); setView('canvas') }} />}
        {view === 'flows' && <FlowsView flows={model.flows} elements={model.elements} onAdd={() => setModal('flow')} onAddStep={addStep} onUpdateStep={updateFlowStep} onUpdateFlow={updateFlow} />}
        {view === 'plan' && <PlanView project={project} scenario={scenario} model={model} onExport={exportPlan} />}
      </main>
      <footer className="statusbar"><span><span className="status-led" /> LOCAL FIRST</span><span>Private by default <i /> No code is uploaded</span><span className="statusbar-right">Workspace autosaved locally</span></footer>
    </div>

    {modal && <ModalHost type={modal} elements={model.elements} onClose={() => setModal(null)} onElement={addElement} onRelationship={addRelationship} onFlow={addFlow} onProject={createProject} onScenario={createScenario} onImport={() => importRef.current?.click()} />}
    <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importBundle} />
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
      { label: 'Undo last change', hint: 'Ctrl/Cmd + Z', icon: Undo2, run: undo },
      { label: 'Redo last change', hint: 'Ctrl/Cmd + Shift + Z', icon: Redo2, run: redo },
    ]} />}
    {toast && <div className="toast"><Check size={15} />{toast}</div>}
  </div>
}

function setWorkspaceTheme(workspace: Workspace, commit: (update: (current: Workspace) => Workspace) => void) { commit((current) => { current.theme = workspace.theme === 'dark' ? 'light' : 'dark'; return current }) }
function slug(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'architecture' }

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) { return <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick} title={label}><Icon size={18} /><span>{label}</span></button> }

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

function Inspector({ element, edges, model, onUpdate, onDelete, onAddRelationship }: { element: Element | null; edges: Relationship[]; model: ArchitectureModel; onUpdate: (id: string, patch: Partial<Element>) => void; onDelete: (id: string) => void; onAddRelationship: () => void }) {
  return <aside className="inspector">
    <div className="inspector-heading"><div><span className="eyebrow">INSPECTOR</span><h2>{element ? 'Element details' : 'Explore the model'}</h2></div><button className="icon-button" aria-label="More details"><MoreHorizontal size={17} /></button></div>
    {element ? <>
      <div className="inspector-identity"><span className="identity-icon">{(() => { const Icon = kindIcon(element.kind); return <Icon size={19} /> })()}</span><div><span className="kind-chip">{kindLabel(element.kind)}</span><strong>{element.name}</strong></div></div>
      <div className="field"><label htmlFor="element-name">Name</label><input id="element-name" value={element.name} onChange={(event) => onUpdate(element.id, { name: event.target.value })} /></div>
      <div className="field"><label htmlFor="element-description">Responsibility</label><textarea id="element-description" value={element.description} placeholder="What does this element own?" onChange={(event) => onUpdate(element.id, { description: event.target.value })} rows={3} /></div>
      <div className="field"><label htmlFor="element-path">Repository path</label><div className="input-with-icon"><FileCode2 size={14} /><input id="element-path" value={element.path} placeholder="src/..." onChange={(event) => onUpdate(element.id, { path: event.target.value })} /></div></div>
      <div className="field"><label htmlFor="element-status">Model status</label><select id="element-status" value={element.status} onChange={(event) => onUpdate(element.id, { status: event.target.value as Element['status'] })}><option value="declared">Declared</option><option value="proposed">Proposed</option><option value="inferred">Inferred</option><option value="observed">Observed</option></select><small className="field-help">Proposed items describe a scenario change, not confirmed production behavior.</small></div>
      <div className="inspector-section"><div className="section-heading"><span>Connections</span><button className="text-button small" onClick={onAddRelationship}><Plus size={13} /> Add</button></div>
        {edges.length ? edges.map((edge) => { const other = model.elements.find((item) => item.id === (edge.fromId === element.id ? edge.toId : edge.fromId)); return <div className="connection-row" key={edge.id}><span className="connection-kind">{edge.kind}</span><ArrowRight size={12} /><span className="connection-name">{other?.name ?? 'Unknown element'}</span></div> }) : <p className="subtle-copy">No connections yet. Add a typed relationship to show how this element interacts.</p>}
      </div>
      <div className="inspector-bottom"><span><span className={`status-chip ${element.status}`} /> {element.status[0].toUpperCase() + element.status.slice(1)} model fact</span><button className="danger-button" onClick={() => onDelete(element.id)}><Trash2 size={14} /> Remove</button></div>
    </> : <div className="inspector-empty"><div className="empty-icon"><Sparkles size={20} /></div><h3>Select an element</h3><p>Inspect responsibilities, repository references, and relationships without losing the canvas context.</p><div className="quick-tips"><span><kbd>⌘ K</kbd> Open commands</span><span><kbd>/</kbd> Search elements</span><span>Choose an element on the canvas to begin</span></div></div>}
  </aside>
}

function RepositoryView({ model, onAdd, onSelect }: { model: ArchitectureModel; onAdd: () => void; onSelect: (id: string) => void }) {
  const pathItems = model.elements.filter((element) => element.path).sort((a, b) => a.path.localeCompare(b.path))
  const dirs = new Set<string>()
  for (const element of pathItems) { const parts = element.path.split('/'); for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/')) }
  return <div className="page-view"><div className="view-heading"><div><div className="eyebrow">PROJECT MODEL <span className="eyebrow-dot" /> PATHS AND RESPONSIBILITIES</div><h1>Repository map</h1><p>Browse the repository shape captured in this architecture model.</p></div><button className="button primary" onClick={onAdd}><Plus size={15} /> Add folder or file</button></div>
    <div className="repository-card"><div className="repository-top"><div><FolderTree size={17} /><strong>Project tree</strong><span>{pathItems.length} linked elements</span></div><button className="text-button" onClick={onAdd}><Plus size={14} /> Add path</button></div>
      {pathItems.length ? <div className="tree-list">{([...Array.from(dirs).map((path) => ({ path, dir: true, depth: path.split('/').length })), ...pathItems.map((item) => ({ path: item.path, dir: false, depth: item.path.split('/').length, item }))] as { path: string; dir: boolean; depth: number; item?: Element }[]).sort((a, b) => a.path.localeCompare(b.path) || Number(b.dir) - Number(a.dir)).map((row) => <button key={`${row.dir ? 'd' : 'e'}-${row.path}`} className={`tree-row ${row.dir ? 'directory' : ''}`} style={{ paddingLeft: `${16 + (row.depth - 1) * 22}px` }} onClick={() => row.item && onSelect(row.item.id)}><ChevronRight size={13} className={row.dir ? '' : 'invisible'} />{row.dir ? <FolderTree size={15} /> : <FileCode2 size={15} />}<span>{row.path.split('/').at(-1)}</span>{row.item && <><span className="tree-kind">{kindLabel(row.item.kind)}</span><span className={`status-chip ${row.item.status}`} /></>}</button>)}</div> : <div className="empty-state"><FolderTree size={25} /><h3>No repository paths yet</h3><p>Manually add folders and files to ground this architecture in a codebase. Repository import arrives in a later milestone.</p><button className="button secondary" onClick={onAdd}><Plus size={14} /> Add first path</button></div>}
    </div></div>
}

function FlowsView({ flows, elements, onAdd, onAddStep, onUpdateStep, onUpdateFlow }: { flows: Flow[]; elements: Element[]; onAdd: () => void; onAddStep: (flowId: string) => void; onUpdateStep: (flowId: string, stepId: string, patch: Partial<Flow['steps'][number]>) => void; onUpdateFlow: (flowId: string, patch: Partial<Flow>) => void }) {
  const [activeFlowId, setActiveFlowId] = useState(flows[0]?.id ?? '')
  const [cursor, setCursor] = useState<string | null>(null)
  useEffect(() => { if (!flows.some((flow) => flow.id === activeFlowId)) setActiveFlowId(flows[0]?.id ?? '') }, [flows, activeFlowId])
  const flow = flows.find((item) => item.id === activeFlowId)
  const current = flow?.steps.find((step) => step.id === cursor) ?? flow?.steps.find((step) => step.id === flow.entryStepId)
  return <div className="page-view"><div className="view-heading"><div><div className="eyebrow">BEHAVIOR MODEL <span className="eyebrow-dot" /> {flows.length} FLOWS</div><h1>Flows and interactions</h1><p>Trace a user action through the components, state, and data it touches.</p></div><button className="button primary" onClick={onAdd}><Plus size={15} /> Create flow</button></div>
    {flows.length ? <div className="flow-layout"><section className="flow-list-card"><div className="card-label">PROJECT FLOWS</div>{flows.map((item) => <button key={item.id} className={`flow-list-item ${item.id === flow?.id ? 'active' : ''}`} onClick={() => { setActiveFlowId(item.id); setCursor(null) }}><span className="flow-mini-icon"><Workflow size={16} /></span><span><strong>{item.name}</strong><small>{item.steps.length} steps · {item.trigger}</small></span><ChevronRight size={15} /></button>)}<div className="flow-list-bottom"><span>Flow order is editable in the model.</span></div></section>
      {flow && <section className="flow-editor"><div className="flow-editor-head"><div><span className="eyebrow">FLOW PLAYER</span><input className="flow-name-input" aria-label="Flow name" value={flow.name} onChange={(event) => onUpdateFlow(flow.id, { name: event.target.value })} /><div className="trigger-edit"><span>Triggered by</span><input aria-label="Flow trigger" value={flow.trigger} onChange={(event) => onUpdateFlow(flow.id, { trigger: event.target.value })} /></div></div><button className="button secondary" onClick={() => onAddStep(flow.id)}><Plus size={14} /> Add step</button></div>
        <div className="flow-progress"><span>STEP {Math.max(1, flow.steps.findIndex((step) => step.id === current?.id) + 1)} OF {flow.steps.length}</span><div><i style={{ width: `${Math.max(8, (Math.max(1, flow.steps.findIndex((step) => step.id === current?.id) + 1) / flow.steps.length) * 100)}%` }} /></div><button className="text-button" onClick={() => setCursor(flow.entryStepId)}>Reset</button></div>
        <div className="flow-step-focus"><div className="step-number">{Math.max(1, flow.steps.findIndex((step) => step.id === current?.id) + 1).toString().padStart(2, '0')}</div><div className="step-content"><label className="eyebrow">CURRENT STEP</label><input className="step-title-input" value={current?.title ?? ''} onChange={(event) => current && onUpdateStep(flow.id, current.id, { title: event.target.value })} /><textarea value={current?.detail ?? ''} rows={2} onChange={(event) => current && onUpdateStep(flow.id, current.id, { detail: event.target.value })} />
          <label className="field-label" htmlFor="flow-element">Linked architecture element</label><select id="flow-element" value={current?.elementId ?? ''} onChange={(event) => current && onUpdateStep(flow.id, current.id, { elementId: event.target.value || undefined })}><option value="">No linked element</option>{elements.map((element) => <option key={element.id} value={element.id}>{element.name}</option>)}</select>
          <div className="branch-options"><span className="field-label">Continue to</span>{current?.next.map((nextId, index) => { const next = flow.steps.find((step) => step.id === nextId); return next ? <div key={nextId} className="branch-row"><button className="branch-button" onClick={() => setCursor(nextId)}><span>{next.branchLabel || (current.next.length > 1 ? `Option ${String.fromCharCode(65 + index)}` : 'Next step')}</span><strong>{next.title}</strong><ArrowRight size={15} /></button><input className="branch-label-input" aria-label={`Label for ${next.title}`} placeholder="Outcome label" value={next.branchLabel ?? ''} onChange={(event) => onUpdateStep(flow.id, next.id, { branchLabel: event.target.value })} /></div> : null })}{current && <select className="add-outcome" aria-label="Add a flow outcome" value="" onChange={(event) => { if (event.target.value) onUpdateStep(flow.id, current.id, { next: [...current.next, event.target.value] }) }}><option value="">+ Connect an outcome to another step…</option>{flow.steps.filter((step) => step.id !== current.id && !current.next.includes(step.id)).map((step) => <option key={step.id} value={step.id}>{step.title}</option>)}</select>}</div>
        </div></div>
        <div className="flow-timeline"><span className="eyebrow">FLOW STEPS</span>{flow.steps.map((step, index) => <button key={step.id} className={`timeline-step ${step.id === current?.id ? 'active' : ''}`} onClick={() => setCursor(step.id)}><span className="timeline-index">{String(index + 1).padStart(2, '0')}</span><span>{step.title}</span>{step.elementId && <span className="timeline-linked">{elements.find((element) => element.id === step.elementId)?.name}</span>}</button>)}</div>
      </section>}</div> : <div className="empty-state flow-empty"><div className="empty-icon"><Workflow size={24} /></div><h3>Give the system a behavior</h3><p>Flows connect architecture elements into a sequence you can inspect and rehearse.</p><button className="button primary" onClick={onAdd}><Plus size={15} /> Create your first flow</button></div>}
  </div>
}

function PlanView({ project, scenario, model, onExport }: { project: Project; scenario: Project['scenarios'][number]; model: ArchitectureModel; onExport: () => void }) {
  const proposed = model.elements.filter((element) => element.status === 'proposed')
  const baselineById = new Map(project.baseline.elements.map((element) => [element.id, element]))
  const currentById = new Map(model.elements.map((element) => [element.id, element]))
  const added = model.elements.filter((element) => !baselineById.has(element.id))
  const removed = project.baseline.elements.filter((element) => !currentById.has(element.id))
  const changed = model.elements.filter((element) => {
    const before = baselineById.get(element.id)
    return before && ['kind', 'name', 'description', 'path', 'status'].some((key) => before[key as keyof Element] !== element[key as keyof Element])
  })
  return <div className="page-view plan-page"><div className="view-heading"><div><div className="eyebrow">SCENARIO OUTPUT <span className="eyebrow-dot" /> MARKDOWN</div><h1>Change plan</h1><p>Turn the current scenario into an editable implementation brief.</p></div><button className="button primary" onClick={onExport}><Download size={15} /> Export Markdown</button></div>
    <div className="plan-grid"><div className="plan-document"><div className="document-top"><span className="document-icon"><FileCode2 size={16} /></span><span><strong>{slug(scenario.name)}-change-plan.md</strong><small>Markdown preview · generated from the active scenario</small></span><button className="icon-button" onClick={onExport} title="Export plan"><Download size={15} /></button></div><article className="markdown-preview"><div className="md-kicker">IMPLEMENTATION PLAN · {project.name.toUpperCase()}</div><h2>{scenario.name}</h2><p className="md-lead">{scenario.description || 'An architecture change proposal ready for decisions and implementation detail.'}</p><hr /><h3>Proposed architecture</h3>{proposed.length ? <ul>{proposed.map((element) => <li key={element.id}><strong>{element.name}</strong> <span className="status-pill proposed">Proposed</span><p>{element.description || 'Responsibility needs description.'}</p></li>)}</ul> : <p className="md-muted">No proposed elements yet. Proposed changes appear here as the scenario evolves.</p>}<h3>Connections in scope</h3>{model.relationships.length ? <ul>{model.relationships.map((edge) => <li key={edge.id}>{model.elements.find((item) => item.id === edge.fromId)?.name} <strong>{edge.kind}</strong> {model.elements.find((item) => item.id === edge.toId)?.name}<span className={`status-pill ${edge.status}`}>{edge.status}</span></li>)}</ul> : <p className="md-muted">No relationships have been recorded.</p>}<h3>Flows to validate</h3>{model.flows.length ? model.flows.map((flow) => <div className="preview-flow" key={flow.id}><strong>{flow.name}</strong><p>{flow.trigger}</p><ol>{flow.steps.map((step) => <li key={step.id}>{step.title} — {step.detail}</li>)}</ol></div>) : <p className="md-muted">No flows have been modeled yet.</p>}<h3>Open decisions</h3><ul><li>What consistency, error-handling, and ownership policies need an explicit decision?</li><li>Which tests should validate each modeled branch and failure path?</li><li>Which assumptions should be confirmed against implementation evidence?</li></ul></article></div>
      <aside className="plan-sidebar"><div className="plan-side-card"><span className="eyebrow">SCENARIO SUMMARY</span><div className="summary-value">{model.elements.length}<small> elements</small></div><div className="summary-stats"><span>{model.relationships.length} relationships</span><span>{model.flows.length} modeled flows</span><span>{proposed.length} proposed elements</span></div></div><div className="plan-side-card"><span className="eyebrow">SCENARIO VS BASELINE</span><h3>Model changes</h3><div className="diff-counts"><span><strong>+{added.length}</strong> added</span><span><strong>−{removed.length}</strong> removed</span><span><strong>~{changed.length}</strong> changed</span></div><div className="diff-names">{added.slice(0, 4).map((element) => <span key={element.id} className="diff-added">+ {element.name}</span>)}{changed.slice(0, 4).map((element) => <span key={element.id} className="diff-changed">~ {element.name}</span>)}{removed.slice(0, 4).map((element) => <span key={element.id} className="diff-removed">− {element.name}</span>)}{!added.length && !removed.length && !changed.length && <span className="md-muted">No element differences.</span>}</div></div><div className="plan-side-card"><span className="eyebrow">MODEL PROVENANCE</span><h3>Manual architecture model</h3><p>This plan is generated from declared and proposed scenario data. No repository source has been imported or verified.</p><span className="privacy-note"><span className="status-led" /> Stored on this device</span></div></aside></div>
  </div>
}

function ModalHost({ type, elements, onClose, onElement, onRelationship, onFlow, onProject, onScenario, onImport }: { type: Exclude<Modal, null>; elements: Element[]; onClose: () => void; onElement: (values: Pick<Element, 'name' | 'kind' | 'description' | 'path'>) => void; onRelationship: (fromId: string, toId: string, kind: Relationship['kind'], label: string) => void; onFlow: (name: string) => void; onProject: (name: string) => void; onScenario: (name: string, description: string) => void; onImport: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [path, setPath] = useState('')
  const [kind, setKind] = useState<Element['kind']>('service')
  const [fromId, setFromId] = useState(elements[0]?.id ?? '')
  const [toId, setToId] = useState(elements[1]?.id ?? '')
  const [relation, setRelation] = useState<Relationship['kind']>('depends-on')
  const [label, setLabel] = useState('')
  const title = ({ element: 'Add architecture element', relationship: 'Create relationship', flow: 'Create a flow', project: 'New project', scenario: 'Branch a scenario', import: 'Import local bundle' } as const)[type]
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (type === 'element') onElement({ name: name.trim(), kind, description, path })
    if (type === 'relationship') onRelationship(fromId, toId, relation, label)
    if (type === 'flow') onFlow(name.trim())
    if (type === 'project') onProject(name.trim())
    if (type === 'scenario') onScenario(name.trim(), description)
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal-card"><div className="modal-top"><div><span className="eyebrow">ARCHITECTURE LAB</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose}><X size={17} /></button></div>
    {type === 'import' ? <><p className="modal-copy">Choose a JSON project bundle saved from Architecture Lab. Import is validated before it replaces the active local workspace.</p><button className="button primary modal-submit" onClick={onImport}><Upload size={15} /> Choose bundle</button></> : <form onSubmit={submit}>
      {type === 'element' && <><div className="field"><label htmlFor="new-element-name">Element name</label><input id="new-element-name" required autoFocus placeholder="e.g. Product cache" value={name} onChange={(event) => setName(event.target.value)} /></div><div className="field"><label htmlFor="new-element-kind">Element type</label><select id="new-element-kind" value={kind} onChange={(event) => setKind(event.target.value as Element['kind'])}>{elementKinds.map((item) => <option key={item} value={item}>{kindLabel(item)}</option>)}</select></div><div className="field"><label htmlFor="new-element-description">Responsibility</label><textarea id="new-element-description" rows={2} placeholder="What does it own?" value={description} onChange={(event) => setDescription(event.target.value)} /></div><div className="field"><label htmlFor="new-element-path">Repository path <span className="optional">optional</span></label><input id="new-element-path" placeholder="src/features/..." value={path} onChange={(event) => setPath(event.target.value)} /></div></>}
      {type === 'relationship' && <>{elements.length < 2 ? <p className="modal-copy">Add at least two architecture elements before creating a relationship.</p> : <><div className="field"><label htmlFor="relation-from">From</label><select id="relation-from" value={fromId} onChange={(event) => setFromId(event.target.value)}>{elements.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="field"><label htmlFor="relation-kind">Relationship type</label><select id="relation-kind" value={relation} onChange={(event) => setRelation(event.target.value as Relationship['kind'])}>{relationshipKinds.map((item) => <option key={item} value={item}>{kindLabel(item)}</option>)}</select></div><div className="field"><label htmlFor="relation-to">To</label><select id="relation-to" value={toId} onChange={(event) => setToId(event.target.value)}>{elements.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="field"><label htmlFor="relation-label">Label <span className="optional">optional</span></label><input id="relation-label" placeholder="e.g. cache miss" value={label} onChange={(event) => setLabel(event.target.value)} /></div></>}</>}
      {(type === 'flow' || type === 'project' || type === 'scenario') && <><div className="field"><label htmlFor="name-field">{type === 'flow' ? 'Flow name' : type === 'project' ? 'Project name' : 'Scenario name'}</label><input id="name-field" autoFocus required placeholder={type === 'flow' ? 'e.g. Product detail load' : type === 'project' ? 'e.g. Commerce platform' : 'e.g. Event-driven invalidation'} value={name} onChange={(event) => setName(event.target.value)} /></div>{type !== 'flow' && <div className="field"><label htmlFor="description-field">{type === 'scenario' ? 'What are you exploring?' : 'Project description'} <span className="optional">optional</span></label><textarea id="description-field" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A short note to preserve context." /></div>}{type === 'scenario' && <p className="modal-note"><GitBranch size={14} /> The current model is copied into this branch. Its edits stay separate from other scenarios.</p>}</>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={type === 'relationship' && elements.length < 2}>{type === 'element' ? <Plus size={15} /> : type === 'relationship' ? <Link2 size={15} /> : type === 'scenario' ? <GitBranch size={15} /> : <Check size={15} />}{type === 'scenario' ? 'Create branch' : type === 'relationship' ? 'Add relationship' : type === 'element' ? 'Add element' : type === 'project' ? 'Create project' : 'Create flow'}</button></div>
    </form>}
  </div></div>
}

function CommandPalette({ query, setQuery, onClose, onAction, actions }: { query: string; setQuery: (value: string) => void; onClose: () => void; onAction: (action: () => void) => void; actions: { label: string; hint: string; icon: LucideIcon; run: () => void }[] }) {
  const filtered = actions.filter((action) => `${action.label} ${action.hint}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="modal-backdrop command-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="command-palette"><div className="command-search"><Search size={18} /><input autoFocus placeholder="Search commands and actions…" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') onClose(); if (event.key === 'Enter' && filtered[0]) onAction(filtered[0].run) }} /><kbd>ESC</kbd></div><div className="command-list"><div className="card-label">SUGGESTED ACTIONS</div>{filtered.map((action) => <button key={action.label} className="command-option" onClick={() => onAction(action.run)}><span className="command-option-icon"><action.icon size={16} /></span><span><strong>{action.label}</strong><small>{action.hint}</small></span><ArrowRight size={15} /></button>)}{!filtered.length && <div className="no-commands">No matching commands.</div>}</div><div className="command-footer"><span><kbd>↵</kbd> Select</span><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>esc</kbd> Close</span></div></div></div>
}

export default App
