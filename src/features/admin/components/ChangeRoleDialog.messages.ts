import { defineMessages } from '../../../shared/i18n'

export const changeRoleDialogMessages = defineMessages({
  vi: {
    title: 'Đổi vai trò',
    close: 'Đóng',
    user: 'Người dùng:',
    newRole: 'Vai trò mới',
    reason: 'Lý do (tuỳ chọn)',
    reasonPlaceholder: 'Ví dụ: Thăng chức, chuyển bộ phận...',
    cancel: 'Huỷ',
    saving: 'Đang lưu...',
    save: 'Lưu thay đổi',
    genericError: 'Lỗi khi đổi vai trò.',
  },
  en: {
    title: 'Change role',
    close: 'Close',
    user: 'User:',
    newRole: 'New role',
    reason: 'Reason (optional)',
    reasonPlaceholder: 'E.g.: Promotion, department transfer...',
    cancel: 'Cancel',
    saving: 'Saving...',
    save: 'Save changes',
    genericError: 'Failed to change role.',
  },
})
