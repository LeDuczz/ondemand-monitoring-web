import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { EmailField } from './EmailField'
import { forgotFormMessages } from './ForgotForm.messages'

export function ForgotForm({
  email,
  onEmailChange,
  fieldErrors,
  isSubmitting,
  onBackToLogin,
}: {
  email: string
  onEmailChange: (value: string) => void
  fieldErrors: Record<string, string>
  isSubmitting: boolean
  onBackToLogin: () => void
}) {
  const { t } = useI18n(forgotFormMessages)
  return (
    <>
      <EmailField
        value={email}
        onChange={onEmailChange}
        error={fieldErrors.email}
      />
      <button
        type="submit"
        className="odm-btn odm-btn-p odm-auth-submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? t.sending : t.sendResetCode}
      </button>
      <button type="button" className="odm-auth-back" onClick={onBackToLogin}>
        <Icon name="arrow-left" /> {t.backToLogin}
      </button>
    </>
  )
}
