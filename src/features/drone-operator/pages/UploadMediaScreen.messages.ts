import { defineMessages } from '../../../shared/i18n'

export const uploadMediaScreenMessages = defineMessages({
  vi: {
    stepTitle: 'Upload media',
    uploadPermissionNote: 'Upload ảnh cần Inspector đã nhận nhiệm vụ, khi mission ở PENDING_REVIEW hoặc COMPLETED. Pilot xem ảnh đã chụp; checklist chỉ sửa khi backend cấp quyền giám sát.',
    checkingPermissions: 'Đang xác nhận quyền upload…',
    permissionsUnavailable: 'Không tải được quyền upload. Bấm Làm mới để thử lại.',
    enlargePreview: 'Xem ảnh lớn',
    closePreview: 'Đóng ảnh',
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
    backToResult: 'Quay lại kết quả',
    refresh: 'Làm mới',
    uploadAll: 'Upload tất cả',
    viewOnly: 'Chỉ xem media',
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
  },
  en: {
    uploadPermissionNote: 'Uploading requires an accepted Inspector assignment and a PENDING_REVIEW or COMPLETED mission. Pilots can preview captures; checklist editing follows the backend monitoring capability.',
    checkingPermissions: 'Checking upload permissions…',
    permissionsUnavailable: 'Could not load upload permissions. Refresh to retry.',
    enlargePreview: 'Enlarge image',
    closePreview: 'Close image',
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
    backToResult: 'Back to results',
    refresh: 'Refresh',
    uploadAll: 'Upload all',
    viewOnly: 'View only',
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
  },
})
