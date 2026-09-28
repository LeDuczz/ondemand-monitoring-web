import { defineMessages } from '../../../shared/i18n'

export const registerFormMessages = defineMessages({
  vi: {
    fullNameLabel: 'Họ và tên',
    fullNameHint: 'Tối đa 100 ký tự',
    fullNamePlaceholder: 'Nguyễn Văn A',
    passwordHint: 'Tối thiểu 8 ký tự',
    confirmPasswordLabel: 'Xác nhận mật khẩu',
    termsLabel: 'Tôi đồng ý với Điều khoản sử dụng và chính sách bay an toàn.',
    creatingAccount: 'Đang tạo tài khoản...',
    createAccount: 'Tạo tài khoản',
  },
  en: {
    fullNameLabel: 'Full name',
    fullNameHint: 'Up to 100 characters',
    fullNamePlaceholder: 'John Smith',
    passwordHint: 'At least 8 characters',
    confirmPasswordLabel: 'Confirm password',
    termsLabel: 'I agree to the Terms of Use and safe flight policy.',
    creatingAccount: 'Creating account...',
    createAccount: 'Create account',
  },
})
