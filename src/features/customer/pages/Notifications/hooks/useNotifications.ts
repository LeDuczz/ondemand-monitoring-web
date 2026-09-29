import { useMemo, useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerMediaApi } from '../../../api/customerMediaApi'
import { customerMissionHistoryApi } from '../../../api/customerMissionHistoryApi'
import { toMediaNotification } from '../../../lib/media/mapMedia'
import { sortNotifications } from '../../../lib/media/notifications'

export const NOTIFICATION_PAGE_SIZE = 20

/**
 * `GET /api/customer/media-notifications` (newest first, paged client-side).
 * Mission codes come from the mission history and are best effort.
 */
export function useNotifications() {
  const notifications = useApiQuery(
    (signal) =>
      customerMediaApi
        .listNotifications(signal)
        .then((rows) => sortNotifications(rows.map(toMediaNotification))),
    [],
  )
  const missions = useApiQuery((signal) => customerMissionHistoryApi.listAll(signal), [])
  const [page, setPage] = useState(0)

  const labels = useMemo(
    () => Object.fromEntries((missions.data ?? []).map((m) => [m.id, m.missionCode])),
    [missions.data],
  )
  const all = notifications.data ?? []
  const totalPages = Math.ceil(all.length / NOTIFICATION_PAGE_SIZE)
  const safePage = Math.min(page, Math.max(0, totalPages - 1))

  return {
    loaded: notifications.data !== undefined,
    loading: notifications.loading,
    error: notifications.error,
    reload: () => {
      notifications.reload()
      missions.reload()
    },
    labels,
    total: all.length,
    items: all.slice(safePage * NOTIFICATION_PAGE_SIZE, (safePage + 1) * NOTIFICATION_PAGE_SIZE),
    page: safePage,
    totalPages,
    setPage,
  }
}
