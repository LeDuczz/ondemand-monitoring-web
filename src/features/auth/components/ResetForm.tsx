import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { EmailField } from './EmailField'
import { Field } from './Field'
import { PasswordField } from './PasswordField'
import { resetFormMessages } from './ResetForm.messages'

export function ResetForm({
  email,
  onEmailChange,
  otpCode,
  onOtpCodeChange,
  newPassword,
  onNewPasswordChange,
  fieldErrors,
  isSubmitting,
  onBackToLogin,
}: {
  email: string
  onEmailChange: (value: string) => void
  otpCode: string
  onOtpCodeChange: (value: string) => void
  newPassword: string
  onNewPasswordChange: (value: string) => void
  fieldErrors: Record<string, string>
  isSubmitting: boolean
  onBackToLogin: () => void
}) {
  const { t } = useI18n(resetFormMessages)
  return (
    <>
      <EmailField
        value={email}
        onChange={onEmailChange}
        error={fieldErrors.email}
      />
      <Field
        label={t.codeLabel}
        htmlFor="otpCode"
        hint={t.codeHint}
        error={fieldErrors.otpCode}
      >
        <div className="odm-auth-input-wrap">
          <Icon name="ticket" />
          <input
            id="otpCode"
            name="otpCode"
            className={`odm-inp${fieldErrors.otpCode ? ' odm-inp-err' : ''}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otpCode}
            onChange={(event) =>
              onOtpCodeChange(event.target.value.replace(/\D/g, ''))
            }
            placeholder="000000"
            required
          />
        </div>
      </Field>
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
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
      </button>
      <button type="button" className="odm-auth-back" onClick={onBackToLogin}>
        <Icon name="arrow-left" /> Quay lại đăng nhập
      </button>
    </>
  )
}
