import { useMemo, useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerMediaApi } from '../../../api/customerMediaApi'
import { customerMissionHistoryApi } from '../../../api/customerMissionHistoryApi'
import { sortNewestFirst, toMediaItem } from '../../../lib/media/mapMedia'
import type { MediaItem } from '../../../lib/media/types'

/**
 * The BE has no "media of an order" endpoint: the order's missions come from
 * `GET /api/customer/mission-history` (filtered by `orderId`) and their files
 * from `GET /api/customer/available-media`.
 */
export function useOrderMedia(orderId: string) {
  const query = useApiQuery(async (signal) => {
    const [history, media] = await Promise.all([
      customerMissionHistoryApi.listAll(signal),
      customerMediaApi.listAvailable(signal),
    ])
    const missions = history.filter((m) => m.orderId === orderId)
    const items = sortNewestFirst(media.map(toMediaItem))
    return missions.map((mission) => ({
      mission,
      items: items.filter((i) => i.missionId === mission.id),
    }))
  }, [orderId])

  const [previewId, setPreviewId] = useState<string | null>(null)
  const sections = useMemo(() => query.data ?? [], [query.data])

  const flat: MediaItem[] = sections.flatMap((s) => s.items)
  const index = flat.findIndex((i) => i.id === previewId)
  const previewSection = sections.find((s) => s.items.some((i) => i.id === previewId))

  return {
    loaded: query.data !== undefined,
    loading: query.loading,
    error: query.error,
    reload: query.reload,
    sections,
    totalMedia: flat.length,
    preview: index >= 0 ? flat[index] : null,
    previewLabel: previewSection?.mission.missionCode ?? '',
    openPreview: (id: string) => setPreviewId(id),
    closePreview: () => setPreviewId(null),
    prevPreview: index > 0 ? () => setPreviewId(flat[index - 1].id) : undefined,
    nextPreview:
      index >= 0 && index < flat.length - 1 ? () => setPreviewId(flat[index + 1].id) : undefined,
  }
}
