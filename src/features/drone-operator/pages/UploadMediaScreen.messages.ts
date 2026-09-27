import { defineMessages } from '../../../shared/i18n'

export const uploadMediaScreenMessages = defineMessages({
  vi: {
    stepTitle: 'Upload media',
    openingMission: 'Đang mở mission',
    summary: (
      uploaded: number,
      total: number,
      uploading: number,
      manual: number,
    ) =>
      `${uploaded}/${total} file đã lên${uploading ? ` · ${uploading} đang lên` : ''}${manual ? ` · ${manual} cần xử lý thủ công` : ''}`,
    summaryNote:
      'Ảnh/video vẫn ở Flight Controller cho đến khi duyệt hoặc xóa bản local.',
    backToCockpit: 'Quay lại buồng lái',
    completingMission: 'Đang chuyển...',
    completeMission: 'Complete mission',
    refresh: 'Làm mới',
    uploadAll: 'Upload tất cả',
    restoringMission: 'Đang khôi phục mission đang mở...',
    loadingMedia: 'Đang tải media…',
    confirmDiscard: (fileName: string) =>
      `Xóa bản local ${fileName} trên Flight Controller?`,
    processing: 'Đang xử lý…',
    approveUpload: 'Duyệt & upload',
    deleteLocal: 'Xóa bản local',
    discard: 'Discard',
    loadMediaFailed: 'Không tải được media trên Flight Controller',
    uploadFailed: 'Upload thất bại',
    deleteFailed: 'Không xóa được media',
    notReadyForPostcheck: (status: string) =>
      `Mission chưa sẵn sàng Postcheck (${status}).`,
    postcheckTransitionFailed: 'Không chuyển được mission sang Postcheck',
  },
  en: {
    stepTitle: 'Upload media',
    openingMission: 'Opening mission',
    summary: (
      uploaded: number,
      total: number,
      uploading: number,
      manual: number,
    ) =>
      `${uploaded}/${total} files uploaded${uploading ? ` · ${uploading} uploading` : ''}${manual ? ` · ${manual} need manual review` : ''}`,
    summaryNote:
      'Photos/videos stay on the Flight Controller until approved or the local copy is discarded.',
    backToCockpit: 'Back to cockpit',
    completingMission: 'Completing...',
    completeMission: 'Complete mission',
    refresh: 'Refresh',
    uploadAll: 'Upload all',
    restoringMission: 'Restoring the open mission...',
    loadingMedia: 'Loading media…',
    confirmDiscard: (fileName: string) =>
      `Delete the local copy of ${fileName} on the Flight Controller?`,
    processing: 'Processing…',
    approveUpload: 'Approve & upload',
    deleteLocal: 'Delete local copy',
    discard: 'Discard',
    loadMediaFailed: 'Could not load media from the Flight Controller',
    uploadFailed: 'Upload failed',
    deleteFailed: 'Could not delete the media',
    notReadyForPostcheck: (status: string) =>
      `Mission is not ready for postcheck (${status}).`,
    postcheckTransitionFailed: 'Could not move the mission to postcheck',
  },
})
