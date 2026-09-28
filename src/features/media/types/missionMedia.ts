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
}

export interface UploadedMissionMediaPage {
  items: UploadedMissionMedia[]
  page: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}

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
