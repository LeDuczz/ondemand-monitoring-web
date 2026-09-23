export type DocType = 'SOP' | 'REGULATION' | 'FAQ' | 'DRONE_SPEC'
export type DocStatus = 'INDEXED' | 'PENDING' | 'FAILED'

export type KnowledgeDoc = {
  id: string
  title: string
  docType: DocType
  version: string
  effectiveFrom: string
  status: DocStatus
  chunkCount: number | null
}

export type RuleSeverity = 'BLOCKER' | 'WARNING' | 'INFO'
export type RuleCategory = 'SCHEDULE' | 'GEO' | 'CAPABILITY' | 'SAFETY'

export type FeasibilityRule = {
  id: string
  code: string
  name: string
  category: RuleCategory
  severity: RuleSeverity
  param: Record<string, unknown>
  messageTemplate: string
  weight: number
  isActive: boolean
}

export type AnalysisVerdict = 'FEASIBLE' | 'RISKY' | 'INFEASIBLE'

export type AnalysisLog = {
  id: string
  orderId: string
  overallVerdict: AnalysisVerdict
  blockerCount: number
  warningCount: number
  ruleEngineMs: number
  llmTokens: number
  triggeredBy: string
  createdAt: string
}

export type CreateDocPayload = {
  title: string
  docType: DocType
  version: string
  effectiveFrom: string
}

export type UpdateRulePayload = {
  severity?: RuleSeverity
  weight?: number
  isActive?: boolean
}
