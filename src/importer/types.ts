import type { ArchitectureModel, RepositorySnapshot } from '../domain'

export interface SourceInput {
  path: string
  text: string
  size: number
}

export interface AnalysisRequest {
  type: 'analyze'
  requestId: string
  rootName: string
  files: SourceInput[]
  excludedSecretFiles: number
  skipped: { path: string; size: number; reason: string }[]
}

export interface AnalysisSuccess {
  type: 'complete'
  requestId: string
  model: ArchitectureModel
  snapshot: RepositorySnapshot
}

export type AnalysisResponse =
  | { type: 'progress'; requestId: string; phase: string; completed: number; total: number; path?: string }
  | AnalysisSuccess
  | { type: 'error'; requestId: string; message: string }

export interface AnalysisSummary {
  elements: number
  files: number
  parsedFiles: number
  imports: number
  symbols: number
  routes: number
  packages: number
  warnings: number
  findings: number
  sourceBytes: number
}
