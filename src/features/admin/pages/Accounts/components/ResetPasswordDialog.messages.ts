import { defineMessages } from '../../../../../shared/i18n'

export const resetPasswordDialogMessages = defineMessages({
  vi: {
    title: 'Reset mật khẩu',
    confirmPrefix: 'Đặt lại mật khẩu cho',
    unsupported: 'BE chưa hỗ trợ',
    unsupportedHint:
      'Backend chưa có endpoint reset mật khẩu cho admin. Chức năng sẽ được bật khi BE bổ sung.',
    cancel: 'Đóng',
    confirm: 'Xác nhận reset',
  },
  en: {
    title: 'Reset password',
    confirmPrefix: 'Reset the password for',
    unsupported: 'Not supported by backend yet',
    unsupportedHint:
      'The backend has no admin password reset endpoint yet. This will be enabled once it is added.',
    cancel: 'Close',
    confirm: 'Confirm reset',
  },
})
