import { defineMessages } from '../../../shared/i18n'

export const resetPasswordDialogMessages = defineMessages({
  vi: {
    title: 'Reset mật khẩu',
    close: 'Đóng',
    confirmPrefix: 'Gửi email reset mật khẩu đến',
    confirmSuffix: '?',
    hint: 'Người dùng sẽ nhận được link đặt lại mật khẩu qua email.',
    cancel: 'Huỷ',
    sending: 'Đang gửi...',
    send: 'Gửi email reset',
    genericError: 'Lỗi khi gửi email reset.',
  },
  en: {
    title: 'Reset password',
    close: 'Close',
    confirmPrefix: 'Send a password reset email to',
    confirmSuffix: '?',
    hint: 'The user will receive a password reset link by email.',
    cancel: 'Cancel',
    sending: 'Sending...',
    send: 'Send reset email',
    genericError: 'Failed to send reset email.',
  },
})
