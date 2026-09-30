import type { AiVerdict, FindingSeverity } from '../../../../shared/types/domain'
import type {
  AnalysisView,
  FindingState,
  FindingView,
  RawAnalysis,
  RawAnalysisFinding,
} from './types'

const VERDICTS: readonly AiVerdict[] = ['FEASIBLE', 'RISKY', 'INFEASIBLE']
const SEVERITIES: readonly FindingSeverity[] = ['BLOCKER', 'WARNING', 'INFO']
const SEVERITY_ORDER: Record<FindingSeverity, number> = {
  BLOCKER: 0,
  WARNING: 1,
  INFO: 2,
}

function toSeverity(value: string | undefined): FindingSeverity {
  return SEVERITIES.includes(value as FindingSeverity)
    ? (value as FindingSeverity)
    : 'INFO'
}

function toState(raw: RawAnalysisFinding): FindingState | null {
  const decided = raw.suggestionState ?? raw.customerAction ?? null
  if (decided === 'ACCEPTED' || decided === 'IGNORED' || decided === 'AUTO_FIXED') {
    return decided
  }
  return raw.suggestionLabel ? 'PENDING' : null
}

export function toFindingView(raw: RawAnalysisFinding, index: number): FindingView {
  return {
    id: raw.id || `finding-${index + 1}`,
    severity: toSeverity(raw.severity),
    ruleCode: raw.ruleCode ?? null,
    fieldRef: raw.fieldRef ?? null,
    message: raw.message ?? '',
    evidence: Object.entries(raw.evidence ?? {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
    suggestionLabel: raw.suggestionLabel ?? null,
    state: toState(raw),
  }
}

/**
 * Maps the free-form latest-analysis body onto a view. `null`/empty means the
 * order has not been analysed yet (the BE documents "returns null if none").
 */
export function toAnalysisView(raw: RawAnalysis | null | undefined): AnalysisView | null {
  if (!raw || typeof raw !== 'object') return null
  const findings = (raw.findings ?? [])
    .map(toFindingView)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
  const count = (severity: FindingSeverity) =>
    findings.filter((f) => f.severity === severity).length
  const verdictText = raw.overallVerdict ?? raw.verdict
  const verdict = VERDICTS.includes(verdictText as AiVerdict)
    ? (verdictText as AiVerdict)
    : count('BLOCKER') > 0
      ? 'INFEASIBLE'
      : count('WARNING') > 0
        ? 'RISKY'
        : 'FEASIBLE'
  return {
    verdict,
    blockerCount: raw.blockerCount ?? count('BLOCKER'),
    warningCount: raw.warningCount ?? count('WARNING'),
    infoCount: raw.infoCount ?? count('INFO'),
    summary: raw.llmSummary ?? null,
    analyzedAt: raw.analyzedAt ?? raw.createdAt ?? null,
    findings,
  }
}
