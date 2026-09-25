import type { Flow, FlowStep } from './domain'

export type SimulationPreset = 'cold-online' | 'warm-online' | 'cache-failure' | 'database-failure' | 'offline'
export interface SimulationState {
  currentStepId: string
  cache: Record<string, string>
  database: Record<string, string>
  online: boolean
  cacheAvailable: boolean
  databaseAvailable: boolean
  queue: { key: string; value: string }[]
  result?: string
  stepCount: number
  done: boolean
  trace: { stepId: string; title: string; outcome: string; summary: string }[]
}
export interface SimulationTransition { state: SimulationState; before: SimulationState; step?: FlowStep; outcome: string; summary: string }

const DEFAULT_KEY = 'product:42'
const DEFAULT_VALUE = 'product-v2'

export function createSimulation(flow: Flow, preset: SimulationPreset): SimulationState {
  const key = DEFAULT_KEY
  const database = { [key]: 'product-v1' }
  const cache: Record<string, string> = preset === 'warm-online' ? { [key]: 'product-v1' } : {}
  return {
    currentStepId: flow.entryStepId, cache, database,
    online: preset !== 'offline', cacheAvailable: preset !== 'cache-failure', databaseAvailable: preset !== 'database-failure',
    queue: [], stepCount: 0, done: false, trace: [],
  }
}

function chooseNext(flow: Flow, step: FlowStep, outcome: string, override?: string) {
  if (override && step.next.includes(override)) return override
  const normalized = outcome.toLowerCase()
  const token = normalized === 'failure' ? ['failure', 'error', 'failed'] : normalized === 'offline' ? ['offline', 'failure', 'error'] : [normalized]
  const matching = step.next.find((nextId) => {
    const label = (flow.steps.find((candidate) => candidate.id === nextId)?.branchLabel ?? '').toLowerCase()
    return token.some((value) => label.includes(value))
  })
  return matching ?? step.next[0]
}

export function advanceSimulation(flow: Flow, current: SimulationState, override?: string): SimulationTransition {
  const before = structuredClone(current)
  if (current.done) return { before, state: current, outcome: 'complete', summary: 'The modeled flow is complete.' }
  const step = flow.steps.find((candidate) => candidate.id === current.currentStepId)
  if (!step) {
    const state = { ...current, done: true }
    return { before, state, outcome: 'invalid', summary: 'The current step no longer exists in this flow.' }
  }
  const state: SimulationState = { ...structuredClone(current), cache: { ...current.cache }, database: { ...current.database }, queue: current.queue.map((item) => ({ ...item })), trace: [...current.trace] }
  const key = step.stateKey?.trim() || DEFAULT_KEY
  const value = step.stateValue?.trim() || state.result || DEFAULT_VALUE
  let outcome = 'success'
  let summary = step.detail || step.title
  switch (step.action ?? 'note') {
    case 'read-cache':
      if (!state.cacheAvailable) { state.result = undefined; outcome = 'failure'; summary = `Cache unavailable while reading ${key}.` }
      else if (Object.hasOwn(state.cache, key)) { state.result = state.cache[key]; outcome = 'hit'; summary = `Cache hit for ${key}; returned ${state.result}.` }
      else { state.result = undefined; outcome = 'miss'; summary = `Cache miss for ${key}.` }
      break
    case 'read-database':
      if (!state.online) { state.result = undefined; outcome = 'offline'; summary = `Database read for ${key} cannot reach the service while offline.` }
      else if (!state.databaseAvailable) { state.result = undefined; outcome = 'failure'; summary = `Database unavailable while reading ${key}.` }
      else if (Object.hasOwn(state.database, key)) { state.result = state.database[key]; summary = `Database returned ${state.result} for ${key}.` }
      else { state.result = undefined; outcome = 'miss'; summary = `No database record exists for ${key}.` }
      break
    case 'write-cache':
      if (!state.cacheAvailable) { outcome = 'failure'; summary = `Cache unavailable; ${key} was not written.` }
      else { state.cache[key] = value; summary = `Wrote ${value} to cache key ${key}.` }
      break
    case 'write-database':
      if (!state.online) { state.queue.push({ key, value }); outcome = 'offline'; summary = `Queued ${key}=${value} for later synchronization.` }
      else if (!state.databaseAvailable) { outcome = 'failure'; summary = `Database unavailable; ${key} was not written.` }
      else { state.database[key] = value; summary = `Persisted ${key}=${value} to the database.` }
      break
    case 'invalidate-cache':
      delete state.cache[key]
      summary = `Invalidated cache key ${key}.`
      break
    case 'set-offline':
      state.online = false; outcome = 'offline'; summary = 'Network is offline; new writes will enter the local queue.'
      break
    case 'set-online':
      state.online = true; outcome = 'online'; summary = 'Network is online; queued work can synchronize.'
      break
    case 'sync-queue':
      if (!state.online) { outcome = 'offline'; summary = `${state.queue.length} queued operation(s) remain pending while offline.` }
      else if (!state.databaseAvailable) { outcome = 'failure'; summary = 'Synchronization failed because the database is unavailable; queued work is retained.' }
      else { for (const item of state.queue) state.database[item.key] = item.value; const count = state.queue.length; state.queue = []; summary = `Synchronized ${count} queued operation(s) to the database.` }
      break
    case 'fail':
      outcome = 'failure'; summary = 'An injected failure was reached at this modeled step.'
      break
    case 'note':
      break
  }
  state.stepCount++
  state.trace.push({ stepId: step.id, title: step.title, outcome, summary })
  if (state.stepCount >= 200) { state.done = true; summary += ' Rehearsal stopped at the 200-step safety limit.' }
  else {
    const next = chooseNext(flow, step, outcome, override)
    if (next) state.currentStepId = next
    else state.done = true
  }
  return { before, state, step, outcome, summary }
}

export function simulationDiff(before: SimulationState, after: SimulationState) {
  const changes: { label: string; before: string; after: string }[] = []
  const compareRecord = (label: string, left: Record<string, string>, right: Record<string, string>) => {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)])
    for (const key of keys) if (left[key] !== right[key]) changes.push({ label: `${label} · ${key}`, before: left[key] ?? '—', after: right[key] ?? '—' })
  }
  compareRecord('Cache', before.cache, after.cache)
  compareRecord('Database', before.database, after.database)
  if (before.online !== after.online) changes.push({ label: 'Network', before: before.online ? 'online' : 'offline', after: after.online ? 'online' : 'offline' })
  if (before.queue.length !== after.queue.length) changes.push({ label: 'Pending queue', before: `${before.queue.length} operation(s)`, after: `${after.queue.length} operation(s)` })
  if (before.result !== after.result) changes.push({ label: 'Read result', before: before.result ?? '—', after: after.result ?? '—' })
  return changes
}
