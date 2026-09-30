import { useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerMissionHistoryApi } from '../../../api/customerMissionHistoryApi'
import { toMissionRow } from '../../../lib/missionHistory/mapMission'

/** `GET /api/customer/mission-history?page&size=20` (finished missions only). */
export function useMissionHistory() {
  const [page, setPage] = useState(0)
  const query = useApiQuery(
    (signal) =>
      customerMissionHistoryApi.list(page, signal).then((result) => ({
        rows: result.items.map(toMissionRow),
        page: result.page,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      })),
    [page],
  )
  return { ...query, page, setPage }
}
