import { useEffect } from 'react'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { missionApi } from '../api/missionApi'
import { checklistExecutionApi } from '../api/checklistExecutionApi'

type MissionMonitoringOptions = {
  autoRefresh?: boolean
}

/** Result locks and actor capabilities are refreshed together with readiness. */
export function useMissionMonitoring(
  missionId: string,
  revision?: unknown,
  options: MissionMonitoringOptions = {},
) {
  const { autoRefresh = true } = options
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
    if (!autoRefresh) return undefined
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
  }, [autoRefresh, query.reload])
  return query
}
