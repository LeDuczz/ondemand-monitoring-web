import { useEffect } from 'react'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { missionApi } from '../api/missionApi'
import { checklistExecutionApi } from '../api/checklistExecutionApi'

/** Result locks and actor capabilities are refreshed together with readiness. */
export function useMissionMonitoring(missionId: string, revision?: unknown) {
  const query = useApiQuery(
    async (signal) => {
      const [checklist, result, permissions] = await Promise.all([
        checklistExecutionApi.getMissionChecklistExecutions(missionId, signal),
        missionApi.getMissionResult(missionId, signal),
        missionApi.getPermissions(missionId),
      ])
      return { checklist, result, permissions }
    },
    [missionId, revision],
  )

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) query.reload()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    const timer = window.setInterval(refresh, 30_000)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [query.reload])
  return query
}
