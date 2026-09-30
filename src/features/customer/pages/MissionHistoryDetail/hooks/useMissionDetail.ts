import { useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerMediaApi } from '../../../api/customerMediaApi'
import { customerMissionHistoryApi } from '../../../api/customerMissionHistoryApi'
import { toMediaItem } from '../../../lib/media/mapMedia'
import { toMediaProgress, toMissionRow } from '../../../lib/missionHistory/mapMission'

export const MEDIA_PAGE_SIZE = 12

/**
 * Mission (`mission-history/{id}`), its result counts (`media-status`) and a
 * page of its files (`missions/{id}/media`). The three fail independently, and
 * files are only requested once the mission itself is readable, so a mission
 * the customer does not own never shows media.
 */
export function useMissionDetail(missionId: string) {
  const mission = useApiQuery(
    (signal) => customerMissionHistoryApi.get(missionId, signal).then(toMissionRow),
    [missionId],
  )
  const [revision, setRevision] = useState(0)
  const [page, setPage] = useState(0)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const readable = mission.data !== undefined

  const progress = useApiQuery(
    (signal) => customerMissionHistoryApi.mediaStatus(missionId, signal).then(toMediaProgress),
    [missionId, revision],
  )
  const media = useApiQuery(
    async (signal) => {
      if (!readable) return undefined
      const result = await customerMediaApi.listMissionMedia(
        missionId,
        page,
        MEDIA_PAGE_SIZE,
        signal,
      )
      return {
        items: result.items.map(toMediaItem),
        page: result.page,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      }
    },
    [missionId, readable, page, revision],
  )

  const items = media.data?.items ?? []
  const index = items.findIndex((i) => i.id === previewId)

  return {
    mission,
    progress,
    media,
    page,
    setPage,
    refreshResults: () => setRevision((value) => value + 1),
    preview: index >= 0 ? items[index] : null,
    openPreview: (id: string) => setPreviewId(id),
    closePreview: () => setPreviewId(null),
    prevPreview: index > 0 ? () => setPreviewId(items[index - 1].id) : undefined,
    nextPreview:
      index >= 0 && index < items.length - 1 ? () => setPreviewId(items[index + 1].id) : undefined,
  }
}
