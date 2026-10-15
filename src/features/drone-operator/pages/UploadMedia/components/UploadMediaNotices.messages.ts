import { defineMessages } from '../../../../../shared/i18n'

export const uploadMediaNoticesMessages = defineMessages({
  vi: {
    loadingMedia: 'Đang tải media…',
    uploadPermissionNote:
      'Upload ảnh cần Inspector đã nhận nhiệm vụ. Bạn vẫn có thể xem media và cập nhật checklist nếu được phân công giám sát.',
    checkingPermissions: 'Đang xác nhận quyền upload…',
    permissionsUnavailable:
      'Không tải được quyền upload. Bấm Làm mới để thử lại.',
  },
  en: {
    loadingMedia: 'Loading media…',
    uploadPermissionNote:
      'Uploading requires an accepted Inspector assignment. You can still view media and update the checklist if assigned to monitoring.',
    checkingPermissions: 'Checking upload permissions…',
    permissionsUnavailable:
      'Could not load upload permissions. Refresh to retry.',
  },
})
