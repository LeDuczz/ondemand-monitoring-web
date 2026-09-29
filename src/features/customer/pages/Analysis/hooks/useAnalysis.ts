import { useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerApi } from '../../../api/customerApi'
import { toAnalysisView } from '../../../lib/analysis/mapAnalysis'
import type { AnalysisView, FindingState, FindingView } from '../../../lib/analysis/types'

export type FindingAction = 'apply' | 'ignore'

/**
 * Latest analysis from the BE (`GET /api/orders/{id}/analysis/latest`). Apply /
 * ignore are mock-only; the outcome is layered over the loaded findings.
 */
export function useAnalysis(orderId: string) {
  const query = useApiQuery(
    (signal) => customerApi.getLatestAnalysis(orderId, signal).then(toAnalysisView),
    [orderId],
  )
  const [decisions, setDecisions] = useState<Record<string, FindingState>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function decide(findingId: string, action: FindingAction) {
    setBusyId(findingId)
    setActionError(null)
    try {
      const call =
        action === 'apply' ? customerApi.applyFindingSuggestion : customerApi.ignoreFinding
      const result = await call(orderId, findingId)
      setDecisions((prev) => ({ ...prev, [findingId]: result.state }))
    } catch (error: unknown) {
      setActionError(error instanceof Error && error.message ? error.message : 'error')
    } finally {
      setBusyId(null)
    }
  }

  const analysis: AnalysisView | null | undefined = query.data
  const findings: FindingView[] = (analysis?.findings ?? []).map((f) =>
    decisions[f.id] ? { ...f, state: decisions[f.id] } : f,
  )

  return {
    loaded: query.data !== undefined,
    analysis,
    findings,
    loading: query.loading,
    error: query.error,
    reload: query.reload,
    busyId,
    actionError,
    decide,
  }
}
