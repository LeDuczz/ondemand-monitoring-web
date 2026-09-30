import { defineMessages } from '../../../shared/i18n'

export const verifyFormMessages = defineMessages({
  vi: {
    codeLabel: 'Mã xác thực',
    codeHint: '6 chữ số',
    verifying: 'Đang xác thực...',
    verify: 'Xác thực email',
    noCodeReceived: 'Chưa nhận được mã?',
    resend: 'Gửi lại mã',
  },
  en: {
    codeLabel: 'Verification code',
    codeHint: '6 digits',
    verifying: 'Verifying...',
    verify: 'Verify email',
    noCodeReceived: "Didn't get a code?",
    resend: 'Resend code',
  },
})
