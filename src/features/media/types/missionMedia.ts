export interface UploadedMissionMedia {
  mediaId: string
  missionId: string
  deviceId: string
  mediaType: string
  fileName: string
  contentType: string
  fileSize: number
  capturedAt: string | null
  availableAt: string | null
  downloadUrl: string
  urlExpiresAt?: string
  /** MAPILLARY_REFERENCE for real-world reference images; undefined for drone/manual media. */
  sourceType?: string | null
  sourceReferenceId?: string | null
  sourceCapturedAt?: string | null
  captureLatitude?: number | null
  captureLongitude?: number | null
  sourceDistanceMeters?: number | null
}

export interface UploadedMissionMediaPage {
  items: UploadedMissionMedia[]
  page: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}

export type MissionMediaReviewStatus =
  | 'PENDING_MANAGER_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'

export interface MissionMediaReader {
  list(
    missionId: string,
    page: number,
    signal?: AbortSignal,
  ): Promise<UploadedMissionMediaPage>
  get(
    missionId: string,
    mediaId: string,
    signal?: AbortSignal,
  ): Promise<UploadedMissionMedia>
}
