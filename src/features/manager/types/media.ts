import type { MediaStatus, MissionStatus } from '../../../shared/types/domain'

/** A manual-upload-task: [TK MNG-11] tab "Manual upload". */
export type ManualUploadTask = {
  id: string
  mediaId: string
  fileName: string
  mediaType: 'VIDEO' | 'PHOTO'
  fileSizeBytes: number
  fileSizeLabel: string
  mediaStatus: MediaStatus
  missionId: string
  missionCode: string
  reason: string
  assignedOperatorId: string
  assignedOperatorName: string
  taskStatus: 'OPEN' | 'IN_PROGRESS' | 'DONE'
  createdAt: string
}

/** A media item that failed validation: [TK MNG-11] tab "Media lỗi validate". */
export type BadMediaItem = {
  id: string
  fileName: string
  mediaType: 'VIDEO' | 'PHOTO'
  fileSizeBytes: number
  fileSizeLabel: string
  mediaStatus: MediaStatus
  missionId: string
  missionCode: string
  validationError: string
  operatorId: string
  operatorName: string
}

/** A completed mission waiting for result delivery: [TK MNG-11] tab "Chờ giao kết quả". */
export type WaitingDeliveryMission = {
  missionId: string
  missionCode: string
  missionStatus: MissionStatus
  missionTitle: string
  orderId: string
  orderCode: string
  customerName: string
  companyName: string
  serviceType: string
  totalFiles: number
  photoCount: number
  videoCount: number
  allValidated: boolean
  validatedAt: string
}

export type MediaNeedsActionResponse = {
  manualUploadTasks: ManualUploadTask[]
  badMediaItems: BadMediaItem[]
  waitingDeliveryMissions: WaitingDeliveryMission[]
}

export type Operator = {
  id: string
  name: string
}
