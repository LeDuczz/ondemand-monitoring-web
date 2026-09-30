import { useMemo } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerMediaApi } from '../../../api/customerMediaApi'
import { customerMissionHistoryApi } from '../../../api/customerMissionHistoryApi'
import { shortId, siblings, toMediaItem } from '../../../lib/media/mapMedia'

/**
 * One asset via `GET /api/media/{mediaId}/download` (fresh URL). Siblings for
 * prev / next and the mission code are best effort and never block the page.
 */
export function useMediaDetail(mediaId: string) {
  const item = useApiQuery(
    (signal) => customerMediaApi.getDownload(mediaId, signal).then(toMediaItem),
    [mediaId],
  )
  const all = useApiQuery(
    (signal) => customerMediaApi.listAvailable(signal).then((rows) => rows.map(toMediaItem)),
    [],
  )
  const missions = useApiQuery((signal) => customerMissionHistoryApi.listAll(signal), [])

  const current = item.data
  const nav = useMemo(
    () => (current && all.data ? siblings(all.data, current) : { prev: null, next: null }),
    [current, all.data],
  )
  const missionLabel = current
    ? (missions.data?.find((m) => m.id === current.missionId)?.missionCode ??
      shortId(current.missionId))
    : ''

  return { item: current, loading: item.loading, error: item.error, reload: item.reload, nav, missionLabel }
}
