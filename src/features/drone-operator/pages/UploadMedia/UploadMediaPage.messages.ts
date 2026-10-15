import { defineMessages } from '../../../../shared/i18n'

export const uploadMediaPageMessages = defineMessages({
  vi: {
    stepTitle: 'Upload media',
    openingMission: 'Đang mở mission',
    restoringMission: 'Đang khôi phục mission đang mở...',
    confirmDiscard: (fileName: string) =>
      `Xóa bản local ${fileName} trên Flight Controller?`,
    loadMediaFailed: 'Không tải được media trên Flight Controller',
    uploadFailed: 'Upload thất bại',
    deleteFailed: 'Không xóa được media',
    checklistItemGone: 'Mục checklist không còn thuộc Mission này.',
    attachEvidenceFailed: 'Không gắn được bằng chứng.',
    localMediaUnavailable: 'Media local không còn khả dụng.',
    pcBackupUploadFailed: 'Không upload được bản sao PC',
    allMediaStored: (referenceCount: number) =>
      `Tất cả media đã được lưu (${referenceCount} ảnh tham chiếu). Không còn file nào chờ upload.`,
    nothingToUpload: 'Không có file nào chờ upload.',
    pendingSent:
      'Đã gửi các file đang chờ. Trạng thái lưu/xác thực được cập nhật từ backend.',
  },
  en: {
    stepTitle: 'Upload media',
    openingMission: 'Opening mission',
    restoringMission: 'Restoring the open mission...',
    confirmDiscard: (fileName: string) =>
      `Delete the local copy of ${fileName} on the Flight Controller?`,
    loadMediaFailed: 'Could not load media from the Flight Controller',
    uploadFailed: 'Upload failed',
    deleteFailed: 'Could not delete the media',
    checklistItemGone: 'The checklist item no longer belongs to this mission.',
    attachEvidenceFailed: 'Could not attach the evidence.',
    localMediaUnavailable: 'The local media is no longer available.',
    pcBackupUploadFailed: 'Could not upload the PC copy',
    allMediaStored: (referenceCount: number) =>
      `All media has been stored (${referenceCount} reference images). No files are waiting to upload.`,
    nothingToUpload: 'No files are waiting to upload.',
    pendingSent:
      'Pending files were sent. Storage/validation status is updated from the backend.',
  },
})
