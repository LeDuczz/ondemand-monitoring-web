import { defineMessages } from '../../../../../shared/i18n'

export const mediaCardMessages = defineMessages({
  vi: {
    unavailable:
      'Bản gốc trên Flight Controller không khả dụng. Chọn bản sao PC để khôi phục.',
    attachFailed: (reason: string) =>
      `Media đã được giữ. Gắn bằng chứng chưa thành công: ${reason}. Chọn “Gắn bằng chứng” để thử lại, không upload lại.`,
    mediaType: {
      IMAGE: 'Ảnh',
      VIDEO: 'Video',
    },
    mediaSource: {
      DRONE_CAMERA: 'Camera drone',
      SATELLITE_SNAPSHOT: 'Ảnh vệ tinh',
      MANUAL_UPLOAD: 'Upload thủ công',
      MAPILLARY_REFERENCE: 'Ảnh tham chiếu Mapillary',
    },
    mediaStatus: {
      REVIEW_PENDING: 'Chờ duyệt',
      UPLOADING: 'Đang upload',
      UPLOAD_FAILED: 'Upload thất bại',
      VALIDATING: 'Đang xác thực',
      MANUAL_UPLOAD_REQUIRED: 'Cần upload thủ công',
      UPLOAD_PENDING: 'Chờ upload',
      RETRY_REQUIRED: 'Cần thử lại',
      PENDING_MANAGER_APPROVAL: 'Chờ manager duyệt',
      AVAILABLE: 'Đã duyệt',
      UPLOADED: 'Đã upload',
    },
  },
  en: {
    unavailable:
      'The original on the Flight Controller is unavailable. Choose the PC copy to restore it.',
    attachFailed: (reason: string) =>
      `The media was kept. Attaching the evidence was not successful: ${reason}. Choose “Attach evidence” to retry without uploading again.`,
    mediaType: {
      IMAGE: 'Image',
      VIDEO: 'Video',
    },
    mediaSource: {
      DRONE_CAMERA: 'Drone camera',
      SATELLITE_SNAPSHOT: 'Satellite image',
      MANUAL_UPLOAD: 'Manual upload',
      MAPILLARY_REFERENCE: 'Mapillary reference image',
    },
    mediaStatus: {
      REVIEW_PENDING: 'Pending review',
      UPLOADING: 'Uploading',
      UPLOAD_FAILED: 'Upload failed',
      VALIDATING: 'Validating',
      MANUAL_UPLOAD_REQUIRED: 'Manual upload required',
      UPLOAD_PENDING: 'Upload pending',
      RETRY_REQUIRED: 'Retry required',
      PENDING_MANAGER_APPROVAL: 'Awaiting manager approval',
      AVAILABLE: 'Approved',
      UPLOADED: 'Uploaded',
    },
  },
})
