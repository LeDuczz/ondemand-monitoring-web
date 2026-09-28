import { defineMessages } from '../../../shared/i18n'
import type { AuthMode } from '../types/authMode'

export const authPageMessages = defineMessages({
  vi: {
    titles: {
      login: 'Đăng nhập',
      register: 'Tạo tài khoản khách hàng',
      verify: 'Xác thực email',
      forgot: 'Quên mật khẩu?',
      reset: 'Đặt lại mật khẩu',
      'first-login': 'Đặt mật khẩu',
    } as Record<AuthMode, string>,
    subtitles: {
      login: 'Chào mừng trở lại. Đăng nhập để quản lý yêu cầu giám sát.',
      register:
        'Dành cho khách hàng cá nhân. Phi công và nhân viên do quản trị viên tạo.',
      verify:
        'Nhập mã 6 số chúng tôi đã gửi tới email của bạn để kích hoạt tài khoản.',
      forgot:
        'Nhập email của bạn, chúng tôi sẽ giúp bạn lấy lại quyền truy cập.',
      reset: 'Dùng mật khẩu mới có ít nhất 8 ký tự.',
      'first-login':
        'Quản trị viên đã tạo tài khoản này. Đặt mật khẩu cá nhân để tiếp tục.',
    } as Record<AuthMode, string>,
    skipLink: 'Bỏ qua tới biểu mẫu',
    eyebrowRegister: 'Tham gia OnDemand Monitor',
    eyebrowOther: 'Truy cập không gian làm việc an toàn',
    useAnotherEmail: 'Dùng email khác',
    accountLocked: 'Tài khoản đã bị khoá.',
    accountLockedDetail: 'Liên hệ quản trị viên qua support@odms.vn để mở lại.',
    invalidCredentials: 'Email hoặc mật khẩu không đúng.',
    genericError: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
    passwordMismatch: 'Mật khẩu không khớp',
    otpSent: (email: string) =>
      `Chúng tôi đã gửi mã xác thực 6 số tới ${email}.`,
    registerSuccess: 'Đăng ký thành công. Bạn có thể đăng nhập ngay.',
    verifySuccess: 'Email đã được xác thực. Bạn có thể đăng nhập.',
    forgotSuccess: 'Mã đặt lại mật khẩu đã được gửi tới email của bạn.',
    resetSuccess:
      'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
    firstLoginRequired: 'Đặt mật khẩu mới để kích hoạt tài khoản.',
    loginSuccess: (suffix: string) => `Đăng nhập thành công${suffix}.`,
    firstLoginSuccess:
      'Đặt mật khẩu thành công. Chào mừng tới OnDemand Monitor.',
    otpResent: (email: string) => `Mã xác thực mới đã được gửi tới ${email}.`,
  },
  en: {
    titles: {
      login: 'Log in',
      register: 'Create a customer account',
      verify: 'Verify email',
      forgot: 'Forgot password?',
      reset: 'Reset password',
      'first-login': 'Set password',
    } as Record<AuthMode, string>,
    subtitles: {
      login: 'Welcome back. Log in to manage your monitoring requests.',
      register:
        'For individual customers. Pilots and staff accounts are created by an administrator.',
      verify:
        'Enter the 6-digit code we sent to your email to activate your account.',
      forgot: 'Enter your email and we will help you regain access.',
      reset: 'Use a new password of at least 8 characters.',
      'first-login':
        'An administrator created this account. Set your own password to continue.',
    } as Record<AuthMode, string>,
    skipLink: 'Skip to form',
    eyebrowRegister: 'Join OnDemand Monitor',
    eyebrowOther: 'Access your secure workspace',
    useAnotherEmail: 'Use another email',
    accountLocked: 'This account has been locked.',
    accountLockedDetail:
      'Contact an administrator at support@odms.vn to unlock it.',
    invalidCredentials: 'Incorrect email or password.',
    genericError: 'Something went wrong. Please try again.',
    passwordMismatch: 'Passwords do not match',
    otpSent: (email: string) =>
      `We sent a 6-digit verification code to ${email}.`,
    registerSuccess: 'Registration successful. You can log in now.',
    verifySuccess: 'Email verified. You can log in now.',
    forgotSuccess: 'A password reset code has been sent to your email.',
    resetSuccess:
      'Password reset successful. You can log in with your new password.',
    firstLoginRequired: 'Set a new password to activate your account.',
    loginSuccess: (suffix: string) => `Login successful${suffix}.`,
    firstLoginSuccess:
      'Password set successfully. Welcome to OnDemand Monitor.',
    otpResent: (email: string) =>
      `A new verification code has been sent to ${email}.`,
  },
})
