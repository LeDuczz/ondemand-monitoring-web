import type { AiVerdict, FindingSeverity } from '../../../../shared/types/domain'

/**
 * Body of `GET /api/orders/{orderId}/analysis/latest`. The BE declares it as a
 * bare `Object` (and currently returns `null`), so every field is optional and
 * the mapper accepts both the `verdict` and `overallVerdict` spellings.
 */
export type RawAnalysisFinding = {
  id?: string
  severity?: string
  ruleCode?: string | null
  fieldRef?: string | null
  message?: string
  evidence?: Record<string, unknown> | null
  suggestionLabel?: string | null
  suggestionState?: string | null
  customerAction?: string | null
}

export type RawAnalysis = {
  orderId?: string
  verdict?: string
  overallVerdict?: string
  blockerCount?: number
  warningCount?: number
  infoCount?: number
  llmSummary?: string | null
  analyzedAt?: string | null
  createdAt?: string | null
  findings?: RawAnalysisFinding[] | null
}

export type FindingState = 'PENDING' | 'ACCEPTED' | 'IGNORED' | 'AUTO_FIXED'

export type FindingView = {
  id: string
  severity: FindingSeverity
  ruleCode: string | null
  fieldRef: string | null
  message: string
  evidence: Array<{ key: string; value: string }>
  suggestionLabel: string | null
  /** null when there is nothing to decide on. */
  state: FindingState | null
}

export type AnalysisView = {
  verdict: AiVerdict
  blockerCount: number
  warningCount: number
  infoCount: number
  summary: string | null
  analyzedAt: string | null
  /** Sorted blockers first, then warnings, then info. */
  findings: FindingView[]
}
