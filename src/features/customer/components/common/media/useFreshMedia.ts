import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerMediaApi } from '../../../api/customerMediaApi'
import { toMediaItem } from '../../../lib/media/mapMedia'

/**
 * Presigned URLs expire, so opening a preview asks the BE for a fresh one
 * (`GET /api/customer/missions/{missionId}/media/{mediaId}`).
 */
export function useFreshMedia(missionId: string, mediaId: string) {
  return useApiQuery(
    (signal) => customerMediaApi.getMissionMedia(missionId, mediaId, signal).then(toMediaItem),
    [missionId, mediaId],
  )
}
