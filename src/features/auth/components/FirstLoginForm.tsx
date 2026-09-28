import { EmailField } from './EmailField'
import { PasswordField } from './PasswordField'

export function FirstLoginForm({
  email,
  onEmailChange,
  newPassword,
  onNewPasswordChange,
  fieldErrors,
  isSubmitting,
  challengeSession,
}: {
  email: string
  onEmailChange: (value: string) => void
  newPassword: string
  onNewPasswordChange: (value: string) => void
  fieldErrors: Record<string, string>
  isSubmitting: boolean
  challengeSession: string
}) {
  return (
    <>
      <EmailField
        value={email}
        onChange={onEmailChange}
        error={fieldErrors.email}
      />
      <PasswordField
        id="newPassword"
        label="Mật khẩu mới"
        value={newPassword}
        onChange={onNewPasswordChange}
        hint="Tối thiểu 8 ký tự"
        error={fieldErrors.newPassword}
      />
      <button
        type="submit"
        className="odm-btn odm-btn-p odm-auth-submit"
        disabled={isSubmitting || !challengeSession}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Đang lưu mật khẩu...' : 'Tiếp tục vào workspace'}
      </button>
    </>
  )
}
