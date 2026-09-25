export type ElementKind = 'application' | 'package' | 'bounded-context' | 'folder' | 'file' | 'module' | 'function' | 'api-endpoint' | 'database' | 'cache' | 'queue' | 'browser-storage' | 'worker' | 'external-system' | 'service'
export type ElementStatus = 'declared' | 'proposed' | 'inferred' | 'observed'
export type RelationshipKind = 'imports' | 'calls' | 'reads' | 'writes' | 'emits' | 'consumes' | 'invalidates' | 'depends-on' | 'routes-to' | 'persists-to' | 'syncs-with'

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
}

export interface Relationship {
  id: string
  fromId: string
  toId: string
  kind: RelationshipKind
  label: string
  status: ElementStatus
}

export interface FlowStep {
  id: string
  title: string
  elementId?: string
  detail: string
  next: string[]
  branchLabel?: string
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

export interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  baseline: ArchitectureModel
  scenarios: Scenario[]
  activeScenarioId: string
}

export interface Workspace {
  schemaVersion: 1
  projects: Project[]
  activeProjectId: string
  theme: 'dark' | 'light'
}

export const elementKinds: ElementKind[] = ['application', 'package', 'bounded-context', 'folder', 'file', 'module', 'function', 'api-endpoint', 'database', 'cache', 'queue', 'browser-storage', 'worker', 'external-system', 'service']
export const relationshipKinds: RelationshipKind[] = ['imports', 'calls', 'reads', 'writes', 'emits', 'consumes', 'invalidates', 'depends-on', 'routes-to', 'persists-to', 'syncs-with']

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
    { id: uid(), title: 'Check cache', elementId: ids.cache, detail: 'Look up the versioned product key.', next: [], branchLabel: 'cache hit' },
    { id: uid(), title: 'Load from database', elementId: ids.db, detail: 'On a miss, read the authoritative record.', next: [], branchLabel: 'cache miss' },
    { id: uid(), title: 'Fill cache and respond', elementId: ids.get, detail: 'Serialize the product and return the response.', next: [] },
  ]
  steps[0].next = [steps[1].id]
  steps[1].next = [steps[2].id, steps[3].id]
  steps[2].next = [steps[3].id]
  project.baseline = { elements, relationships, flows: [] }
  project.scenarios[0].model = clone(project.baseline)
  project.scenarios[0].name = 'Product cache proposal'
  project.scenarios[0].description = 'Review cache-aside behavior and write invalidation.'
  project.scenarios[0].model.flows = [{ id: uid(), name: 'Product detail load', trigger: 'User opens /products/:id', entryStepId: steps[0].id, steps }]
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
    return project.scenarios.length <= 500 && project.scenarios.every((scenario) => scenario && typeof scenario.id === 'string' && typeof scenario.name === 'string' && typeof scenario.description === 'string' && validModel(scenario.model)) && project.scenarios.some((scenario) => scenario.id === project.activeScenarioId)
  })) return false
  return candidate.projects.some((project) => project.id === candidate.activeProjectId)
}

function validModel(value: unknown): value is ArchitectureModel {
  if (!value || typeof value !== 'object') return false
  const model = value as Partial<ArchitectureModel>
  if (!Array.isArray(model.elements) || !Array.isArray(model.relationships) || !Array.isArray(model.flows)) return false
  if (model.elements.length > 100_000 || model.relationships.length > 500_000 || model.flows.length > 20_000) return false
  const elementIds = new Set<string>()
  for (const element of model.elements) {
    if (!element || typeof element.id !== 'string' || !element.id || typeof element.name !== 'string' || typeof element.kind !== 'string' || typeof element.description !== 'string' || typeof element.path !== 'string' || !['declared', 'proposed', 'inferred', 'observed'].includes(element.status) || !Array.isArray(element.tags) || typeof element.x !== 'number' || !Number.isFinite(element.x) || typeof element.y !== 'number' || !Number.isFinite(element.y)) return false
    if (elementIds.has(element.id)) return false
    elementIds.add(element.id)
  }
  for (const relationship of model.relationships) {
    if (!relationship || typeof relationship.id !== 'string' || !elementIds.has(relationship.fromId) || !elementIds.has(relationship.toId) || !relationshipKinds.includes(relationship.kind) || typeof relationship.label !== 'string' || !['declared', 'proposed', 'inferred', 'observed'].includes(relationship.status)) return false
  }
  for (const flow of model.flows) {
    if (!flow || typeof flow.id !== 'string' || typeof flow.name !== 'string' || typeof flow.trigger !== 'string' || !Array.isArray(flow.steps) || flow.steps.length > 100_000) return false
    const stepIds = new Set(flow.steps.map((step) => step?.id))
    if (!stepIds.has(flow.entryStepId)) return false
    for (const step of flow.steps) if (!step || typeof step.id !== 'string' || typeof step.title !== 'string' || typeof step.detail !== 'string' || !Array.isArray(step.next) || !step.next.every((id) => stepIds.has(id)) || (step.elementId !== undefined && !elementIds.has(step.elementId))) return false
  }
  return true
}
