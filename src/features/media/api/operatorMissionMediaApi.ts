import { apiRequest } from '../../../shared/api/httpClient'

import type {
  UploadedMissionMedia,
  UploadedMissionMediaPage,
} from '../types/missionMedia'
export type {
  UploadedMissionMedia,
  UploadedMissionMediaPage,
} from '../types/missionMedia'

const path = (missionId: string) =>
  `/api/operator/missions/${encodeURIComponent(missionId)}/media`

export const operatorMissionMediaApi = {
  list: (missionId: string, page: number, signal?: AbortSignal) =>
    apiRequest<UploadedMissionMediaPage>(path(missionId), {
      query: { page, size: 12 },
      signal,
    }),
  get: (missionId: string, mediaId: string, signal?: AbortSignal) =>
    apiRequest<UploadedMissionMedia>(
      `${path(missionId)}/${encodeURIComponent(mediaId)}`,
      { signal },
    ),
}
