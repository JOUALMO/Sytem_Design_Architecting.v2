export type ElementKind = 'application' | 'package' | 'bounded-context' | 'folder' | 'file' | 'module' | 'function' | 'class' | 'interface' | 'type' | 'route' | 'api-endpoint' | 'database' | 'cache' | 'queue' | 'browser-storage' | 'worker' | 'external-system' | 'service'
export type ElementStatus = 'declared' | 'proposed' | 'inferred' | 'observed'
export type RelationshipKind = 'contains' | 'imports' | 'calls' | 'reads' | 'writes' | 'emits' | 'consumes' | 'invalidates' | 'depends-on' | 'routes-to' | 'persists-to' | 'syncs-with'

export interface SourceEvidence {
  path: string
  startLine?: number
  endLine?: number
  contentHash?: string
  analyzer: string
  rule: string
  summary: string
}

export interface RepositoryFileRecord {
  path: string
  hash?: string
  size: number
  language?: string
  status: 'parsed' | 'indexed' | 'unsupported' | 'error' | 'skipped'
  reason?: string
  elementIds: string[]
}

export type FindingSeverity = 'high' | 'medium' | 'low' | 'info'
export type FindingStatus = 'open' | 'resolved' | 'suppressed'

export interface ArchitectureFinding {
  id: string
  ruleId: string
  title: string
  category: 'database' | 'cache' | 'client-state' | 'offline-storage' | 'browser-storage'
  severity: FindingSeverity
  confidence: 'high' | 'medium' | 'low'
  description: string
  recommendation: string
  status: FindingStatus
  evidence: SourceEvidence[]
  elementIds: string[]
}

export interface RepositorySnapshot {
  rootName: string
  importedAt: string
  fingerprint: string
  analyzerVersion: string
  profile: { extensions: string[]; ignoredDirectories: string[]; excludedSecretFiles: number; sizeLimitBytes: number; elementLimit: number; symbolLimit: number; importEdgeLimit: number; dependencyEdgeLimit: number }
  files: RepositoryFileRecord[]
  warnings: { path?: string; code: string; message: string }[]
  frameworks: string[]
  packageManager?: string
  findings?: ArchitectureFinding[]
}

export interface Element {
  id: string
  kind: ElementKind
  name: string
  description: string
  path: string
  status: ElementStatus
  tags: string[]
  x: number
  y: number
  source?: SourceEvidence
}

export interface Relationship {
  id: string
  fromId: string
  toId: string
  kind: RelationshipKind
  label: string
  status: ElementStatus
  source?: SourceEvidence
}

export interface FlowStep {
  id: string
  title: string
  elementId?: string
  detail: string
  next: string[]
  branchLabel?: string
  action?: 'note' | 'read-cache' | 'read-database' | 'write-cache' | 'write-database' | 'invalidate-cache' | 'set-offline' | 'set-online' | 'sync-queue' | 'fail'
  stateKey?: string
  stateValue?: string
}

export interface Flow {
  id: string
  name: string
  trigger: string
  entryStepId: string
  steps: FlowStep[]
}

export interface ArchitectureModel {
  elements: Element[]
  relationships: Relationship[]
  flows: Flow[]
}

export interface Scenario {
  id: string
  name: string
  description: string
  createdAt: string
  model: ArchitectureModel
}

export interface PlanningDecision {
  id: string
  kind: 'decision' | 'assumption'
  title: string
  detail: string
  status: 'open' | 'accepted' | 'rejected'
  scenarioId?: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  baseline: ArchitectureModel
  baselineHistory?: { id: string; name: string; capturedAt: string; model: ArchitectureModel; repository?: RepositorySnapshot }[]
  repository?: RepositorySnapshot
  decisions?: PlanningDecision[]
  scenarios: Scenario[]
  activeScenarioId: string
}

export interface Workspace {
  schemaVersion: 1
  projects: Project[]
  activeProjectId: string
  theme: 'dark' | 'light'
}

export interface ProjectBundle {
  format: 'architecture-lab-project'
  formatVersion: 1
  exportedAt: string
  project: Project
}

export const elementKinds: ElementKind[] = ['application', 'package', 'bounded-context', 'folder', 'file', 'module', 'function', 'class', 'interface', 'type', 'route', 'api-endpoint', 'database', 'cache', 'queue', 'browser-storage', 'worker', 'external-system', 'service']
export const relationshipKinds: RelationshipKind[] = ['contains', 'imports', 'calls', 'reads', 'writes', 'emits', 'consumes', 'invalidates', 'depends-on', 'routes-to', 'persists-to', 'syncs-with']

export const uid = () => crypto.randomUUID()
export const clone = <T,>(value: T): T => structuredClone(value)

export function makeProject(name: string): Project {
  const id = uid()
  const scenarioId = uid()
  const model: ArchitectureModel = { elements: [], relationships: [], flows: [] }
  return {
    id, name, description: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    baseline: clone(model), scenarios: [{ id: scenarioId, name: 'Working scenario', description: 'A proposal based on the empty baseline.', createdAt: new Date().toISOString(), model }], activeScenarioId: scenarioId,
  }
}

export function makeStarterProject(): Project {
  const project = makeProject('Product platform')
  project.description = 'A small example architecture to explore and adapt.'
  const ids = { web: uid(), api: uid(), cache: uid(), db: uid(), get: uid(), update: uid() }
  const elements: Element[] = [
    { id: ids.web, kind: 'application', name: 'Web application', description: 'Product detail page and admin UI.', path: 'apps/web', status: 'declared', tags: ['Next.js'], x: 80, y: 150 },
    { id: ids.api, kind: 'api-endpoint', name: 'Product API', description: 'Reads and updates product records.', path: 'apps/web/src/app/api/products', status: 'declared', tags: ['HTTP'], x: 365, y: 150 },
    { id: ids.cache, kind: 'cache', name: 'Redis product cache', description: 'Proposed cache-aside layer; TTL and invalidation policy need review.', path: '', status: 'proposed', tags: ['Redis', 'cache-aside'], x: 680, y: 60 },
    { id: ids.db, kind: 'database', name: 'Product database', description: 'Authoritative product records.', path: 'packages/data', status: 'declared', tags: ['MongoDB'], x: 680, y: 270 },
    { id: ids.get, kind: 'function', name: 'getProduct(id)', description: 'Loads a product for the detail page.', path: 'apps/web/src/features/products/get-product.ts', status: 'declared', tags: ['read path'], x: 365, y: 355 },
    { id: ids.update, kind: 'function', name: 'updateProduct(id)', description: 'Persists admin edits and should invalidate cached reads.', path: 'apps/web/src/features/products/update-product.ts', status: 'declared', tags: ['write path'], x: 80, y: 380 },
  ]
  const relationships: Relationship[] = [
    { id: uid(), fromId: ids.web, toId: ids.get, kind: 'calls', label: 'detail request', status: 'declared' },
    { id: uid(), fromId: ids.get, toId: ids.cache, kind: 'reads', label: 'cache lookup', status: 'proposed' },
    { id: uid(), fromId: ids.get, toId: ids.db, kind: 'reads', label: 'cache miss', status: 'declared' },
    { id: uid(), fromId: ids.update, toId: ids.db, kind: 'writes', label: 'durable update', status: 'declared' },
    { id: uid(), fromId: ids.update, toId: ids.cache, kind: 'invalidates', label: 'after successful write', status: 'proposed' },
  ]
  const steps: FlowStep[] = [
    { id: uid(), title: 'Request product detail', elementId: ids.web, detail: 'The browser requests a product page.', next: [] },
    { id: uid(), title: 'Check cache', elementId: ids.cache, detail: 'Look up product:42 in the cache.', action: 'read-cache', stateKey: 'product:42', next: [] },
    { id: uid(), title: 'Return cached product', elementId: ids.get, detail: 'Return the cached value without reading the database.', next: [], branchLabel: 'cache hit' },
    { id: uid(), title: 'Load from database', elementId: ids.db, detail: 'On a cache miss, read the authoritative record.', action: 'read-database', stateKey: 'product:42', next: [], branchLabel: 'cache miss · cache failure' },
    { id: uid(), title: 'Fill cache and respond', elementId: ids.get, detail: 'Write the database value into the cache before responding.', action: 'write-cache', stateKey: 'product:42', stateValue: 'product-v1', next: [], branchLabel: 'success' },
    { id: uid(), title: 'Return database failure', elementId: ids.api, detail: 'Return a controlled dependency error and preserve retry context.', next: [], branchLabel: 'failure' },
    { id: uid(), title: 'Return offline response', elementId: ids.web, detail: 'Use an explicit offline fallback when no cached value is available.', next: [], branchLabel: 'offline' },
  ]
  steps[0].next = [steps[1].id]
  steps[1].next = [steps[2].id, steps[3].id]
  steps[3].next = [steps[4].id, steps[5].id, steps[6].id]
  project.baseline = { elements, relationships, flows: [] }
  project.scenarios[0].model = clone(project.baseline)
  project.scenarios[0].name = 'Product cache proposal'
  project.scenarios[0].description = 'Review cache-aside behavior and write invalidation.'
  const syncSteps: FlowStep[] = [
    { id: uid(), title: 'Go offline', elementId: ids.web, detail: 'The browser loses its connection.', action: 'set-offline', next: [] },
    { id: uid(), title: 'Save product edit', elementId: ids.update, detail: 'Persist the edit locally and queue it for the server.', action: 'write-database', stateKey: 'product:42', stateValue: 'product-v2', next: [] },
    { id: uid(), title: 'Reconnect', elementId: ids.web, detail: 'The browser observes the connection returning.', action: 'set-online', next: [] },
    { id: uid(), title: 'Synchronize pending edits', elementId: ids.api, detail: 'Apply queued writes to the authoritative database.', action: 'sync-queue', next: [] },
  ]
  syncSteps[0].next = [syncSteps[1].id]; syncSteps[1].next = [syncSteps[2].id]; syncSteps[2].next = [syncSteps[3].id]
  project.scenarios[0].model.flows = [
    { id: uid(), name: 'Product detail load', trigger: 'User opens /products/:id', entryStepId: steps[0].id, steps },
    { id: uid(), name: 'Offline product edit sync', trigger: 'User edits a product while offline', entryStepId: syncSteps[0].id, steps: syncSteps },
  ]
  return project
}

export function activeScenario(project: Project): Scenario {
  return project.scenarios.find((scenario) => scenario.id === project.activeScenarioId) ?? project.scenarios[0]
}

export function validateWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<Workspace>
  if (candidate.schemaVersion !== 1 || !Array.isArray(candidate.projects) || typeof candidate.activeProjectId !== 'string' || (candidate.theme !== 'dark' && candidate.theme !== 'light')) return false
  if (candidate.projects.length > 500 || !candidate.projects.every((project) => {
    if (!project || typeof project !== 'object' || typeof project.id !== 'string' || typeof project.name !== 'string' || typeof project.description !== 'string' || !Array.isArray(project.scenarios) || !project.scenarios.length || typeof project.activeScenarioId !== 'string') return false
    if (!validModel(project.baseline)) return false
    if (project.repository !== undefined && !validRepositorySnapshot(project.repository)) return false
    if (project.decisions !== undefined && (!Array.isArray(project.decisions) || project.decisions.length > 5_000 || !project.decisions.every((item) => item && typeof item.id === 'string' && ['decision', 'assumption'].includes(item.kind) && typeof item.title === 'string' && typeof item.detail === 'string' && ['open', 'accepted', 'rejected'].includes(item.status) && (item.scenarioId === undefined || typeof item.scenarioId === 'string') && typeof item.createdAt === 'string'))) return false
    if (project.baselineHistory !== undefined && (!Array.isArray(project.baselineHistory) || project.baselineHistory.length > 3 || !project.baselineHistory.every((snapshot) => snapshot && typeof snapshot.id === 'string' && typeof snapshot.name === 'string' && typeof snapshot.capturedAt === 'string' && validModel(snapshot.model) && (snapshot.repository === undefined || validRepositorySnapshot(snapshot.repository))))) return false
    return project.scenarios.length <= 500 && project.scenarios.every((scenario) => scenario && typeof scenario.id === 'string' && typeof scenario.name === 'string' && typeof scenario.description === 'string' && validModel(scenario.model)) && project.scenarios.some((scenario) => scenario.id === project.activeScenarioId)
  })) return false
  return candidate.projects.some((project) => project.id === candidate.activeProjectId)
}

export function validateProjectBundle(value: unknown): value is ProjectBundle {
  if (!value || typeof value !== 'object') return false
  const bundle = value as Partial<ProjectBundle>
  if (bundle.format !== 'architecture-lab-project' || bundle.formatVersion !== 1 || typeof bundle.exportedAt !== 'string' || !bundle.project || typeof bundle.project !== 'object') return false
  const project = bundle.project
  return validateWorkspace({ schemaVersion: 1, projects: [project], activeProjectId: project.id, theme: 'dark' })
}

function validRepositorySnapshot(value: unknown): value is RepositorySnapshot {
  if (!value || typeof value !== 'object') return false
  const snapshot = value as Partial<RepositorySnapshot>
  if (typeof snapshot.rootName !== 'string' || typeof snapshot.fingerprint !== 'string' || typeof snapshot.analyzerVersion !== 'string' || typeof snapshot.importedAt !== 'string' || !Array.isArray(snapshot.files) || !Array.isArray(snapshot.warnings) || !Array.isArray(snapshot.frameworks) || !snapshot.profile || typeof snapshot.profile !== 'object') return false
  if (snapshot.files.length > 75_000 || snapshot.warnings.length > 5_000 || !snapshot.frameworks.every((item) => typeof item === 'string')) return false
  return (snapshot.findings === undefined || (Array.isArray(snapshot.findings) && snapshot.findings.length <= 25_000 && snapshot.findings.every(validFinding)))
    && snapshot.files.every((file) => file && typeof file.path === 'string' && !file.path.startsWith('/') && !file.path.split(/[\\/]/).includes('..') && typeof file.size === 'number' && Number.isFinite(file.size) && ['parsed', 'indexed', 'unsupported', 'error', 'skipped'].includes(file.status) && Array.isArray(file.elementIds) && file.elementIds.every((id) => typeof id === 'string'))
    && snapshot.warnings.every((warning) => warning && typeof warning.code === 'string' && typeof warning.message === 'string')
    && Array.isArray(snapshot.profile.extensions) && Array.isArray(snapshot.profile.ignoredDirectories) && typeof snapshot.profile.excludedSecretFiles === 'number' && typeof snapshot.profile.sizeLimitBytes === 'number' && typeof snapshot.profile.elementLimit === 'number' && typeof snapshot.profile.symbolLimit === 'number' && typeof snapshot.profile.importEdgeLimit === 'number' && typeof snapshot.profile.dependencyEdgeLimit === 'number'
}

function validFinding(value: unknown): value is ArchitectureFinding {
  if (!value || typeof value !== 'object') return false
  const finding = value as Partial<ArchitectureFinding>
  return typeof finding.id === 'string' && typeof finding.ruleId === 'string' && typeof finding.title === 'string' && ['database', 'cache', 'client-state', 'offline-storage', 'browser-storage'].includes(finding.category ?? '') && ['high', 'medium', 'low', 'info'].includes(finding.severity ?? '') && ['high', 'medium', 'low'].includes(finding.confidence ?? '') && typeof finding.description === 'string' && typeof finding.recommendation === 'string' && ['open', 'resolved', 'suppressed'].includes(finding.status ?? '') && Array.isArray(finding.evidence) && finding.evidence.length <= 100 && finding.evidence.every(validEvidence) && Array.isArray(finding.elementIds) && finding.elementIds.every((id) => typeof id === 'string')
}

function validModel(value: unknown): value is ArchitectureModel {
  if (!value || typeof value !== 'object') return false
  const model = value as Partial<ArchitectureModel>
  if (!Array.isArray(model.elements) || !Array.isArray(model.relationships) || !Array.isArray(model.flows)) return false
  if (model.elements.length > 100_000 || model.relationships.length > 500_000 || model.flows.length > 20_000) return false
  const elementIds = new Set<string>()
  for (const element of model.elements) {
    if (!element || typeof element.id !== 'string' || !element.id || typeof element.name !== 'string' || !elementKinds.includes(element.kind) || typeof element.description !== 'string' || typeof element.path !== 'string' || !['declared', 'proposed', 'inferred', 'observed'].includes(element.status) || !Array.isArray(element.tags) || typeof element.x !== 'number' || !Number.isFinite(element.x) || typeof element.y !== 'number' || !Number.isFinite(element.y) || (element.source !== undefined && !validEvidence(element.source))) return false
    if (elementIds.has(element.id)) return false
    elementIds.add(element.id)
  }
  for (const relationship of model.relationships) {
    if (!relationship || typeof relationship.id !== 'string' || !elementIds.has(relationship.fromId) || !elementIds.has(relationship.toId) || !relationshipKinds.includes(relationship.kind) || typeof relationship.label !== 'string' || !['declared', 'proposed', 'inferred', 'observed'].includes(relationship.status) || (relationship.source !== undefined && !validEvidence(relationship.source))) return false
  }
  for (const flow of model.flows) {
    if (!flow || typeof flow.id !== 'string' || typeof flow.name !== 'string' || typeof flow.trigger !== 'string' || !Array.isArray(flow.steps) || flow.steps.length > 100_000) return false
    const stepIds = new Set(flow.steps.map((step) => step?.id))
    if (!stepIds.has(flow.entryStepId)) return false
    for (const step of flow.steps) if (!step || typeof step.id !== 'string' || typeof step.title !== 'string' || typeof step.detail !== 'string' || !Array.isArray(step.next) || !step.next.every((id) => stepIds.has(id)) || (step.elementId !== undefined && !elementIds.has(step.elementId)) || (step.action !== undefined && !['note', 'read-cache', 'read-database', 'write-cache', 'write-database', 'invalidate-cache', 'set-offline', 'set-online', 'sync-queue', 'fail'].includes(step.action)) || (step.stateKey !== undefined && typeof step.stateKey !== 'string') || (step.stateValue !== undefined && typeof step.stateValue !== 'string')) return false
  }
  return true
}

function validEvidence(value: unknown): value is SourceEvidence {
  if (!value || typeof value !== 'object') return false
  const evidence = value as Partial<SourceEvidence>
  return typeof evidence.path === 'string' && !evidence.path.startsWith('/') && !evidence.path.split(/[\\/]/).includes('..') && typeof evidence.analyzer === 'string' && typeof evidence.rule === 'string' && typeof evidence.summary === 'string' && (evidence.startLine === undefined || (Number.isInteger(evidence.startLine) && evidence.startLine > 0)) && (evidence.endLine === undefined || (Number.isInteger(evidence.endLine) && evidence.endLine > 0)) && (evidence.contentHash === undefined || typeof evidence.contentHash === 'string')
}
