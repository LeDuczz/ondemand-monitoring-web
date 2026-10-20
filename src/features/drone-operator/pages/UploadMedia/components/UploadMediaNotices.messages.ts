import { defineMessages } from '../../../../../shared/i18n'

export const uploadMediaNoticesMessages = defineMessages({
  vi: {
    loadingMedia: 'Đang tải media…',
    uploadPermissionNote:
      'Upload ảnh cần Pilot hoặc Inspector đã nhận nhiệm vụ. Bạn vẫn có thể xem media và cập nhật checklist nếu được phân công giám sát.',
    inspectorContact: 'Liên hệ người nghiệm thu',
    managerContact: 'Liên hệ Manager',
    notUpdated: 'Chưa cập nhật',
    phoneNotUpdated: 'Chưa cập nhật số điện thoại',
    call: (phone: string) => `Gọi ${phone}`,
    responseStatus: (status?: string | null) =>
      status === 'ACCEPTED'
        ? 'Đã nhận nhiệm vụ'
        : status === 'REJECTED'
          ? 'Đã từ chối nhiệm vụ'
          : 'Chờ nhận nhiệm vụ',
    checkingPermissions: 'Đang xác nhận quyền upload…',
    permissionsUnavailable:
      'Không tải được quyền upload. Bấm Làm mới để thử lại.',
  },
  en: {
    loadingMedia: 'Loading media…',
    uploadPermissionNote:
      'Uploading requires an accepted Pilot or Inspector assignment. You can still view media and update the checklist if assigned to monitoring.',
    inspectorContact: 'Inspector contact',
    managerContact: 'Manager contact',
    notUpdated: 'Not updated',
    phoneNotUpdated: 'Phone number not updated',
    call: (phone: string) => `Call ${phone}`,
    responseStatus: (status?: string | null) =>
      status === 'ACCEPTED'
        ? 'Assignment accepted'
        : status === 'REJECTED'
          ? 'Assignment rejected'
          : 'Awaiting acceptance',
    checkingPermissions: 'Checking upload permissions…',
    permissionsUnavailable:
      'Could not load upload permissions. Refresh to retry.',
  },
})
