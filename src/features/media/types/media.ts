export type MediaType = 'IMAGE' | 'VIDEO'

export type MediaStatus =
  | 'CAPTURING'
  | 'REVIEW_PENDING'
  | 'UPLOAD_PENDING'
  | 'UPLOADING'
  | 'VALIDATING'
  | 'RETRY_REQUIRED'
  | 'AVAILABLE'
  | 'MANUAL_UPLOAD_REQUIRED'
  | 'DISCARDED'
  | 'FAILED'

export type CommandState = 'ACCEPTED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'

export type MediaErrorCode =
  | 'GRPC_UNAVAILABLE'
  | 'UNAUTHENTICATED'
  | 'CAMERA_FRAME_UNAVAILABLE'
  | 'LOCAL_FILE_MISSING'
  | 'STORAGE_UPLOAD_FAILED'
  | 'VALIDATION_FAILED'
  | 'UNKNOWN'

export type LocalMedia = {
  localMediaId: string
  missionId: string
  droneId: string
  mediaType: MediaType
  status: MediaStatus
  fileName: string
  localPath?: string
  contentType: string
  fileSize: number
  checksumSha256: string
  capturedAt: string
  backendMediaId?: string
  errorCode?: MediaErrorCode
  errorMessage?: string
  previewUrl?: string
}

export type MediaCommandAck = {
  commandId: string
  state: CommandState
  media?: LocalMedia
  errorCode?: MediaErrorCode
  errorMessage?: string
}

export type MediaCommandUpdate = MediaCommandAck

export type FlightControllerConnection =
  'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'

export type MediaCommandResult = {
  ack: MediaCommandAck
  unsubscribe?: () => void
}
