import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { EmailField } from './EmailField'
import { loginFormMessages } from './LoginForm.messages'
import { PasswordField } from './PasswordField'

export function LoginForm({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  rememberMe,
  onRememberMeChange,
  fieldErrors,
  isSubmitting,
  onGoogleSignIn,
  onForgotPassword,
}: {
  email: string
  onEmailChange: (value: string) => void
  password: string
  onPasswordChange: (value: string) => void
  rememberMe: boolean
  onRememberMeChange: (value: boolean) => void
  fieldErrors: Record<string, string>
  isSubmitting: boolean
  onGoogleSignIn: () => void
  onForgotPassword: () => void
}) {
  const { t } = useI18n(loginFormMessages)
  return (
    <>
      <button
        type="button"
        className="odm-auth-google"
        onClick={onGoogleSignIn}
      >
        <Icon name="google" />
        {t.continueWithGoogle}
      </button>
      <div className="odm-auth-divider" aria-hidden="true">
        <span>{t.orDivider}</span>
      </div>
      <EmailField
        value={email}
        onChange={onEmailChange}
        error={fieldErrors.email}
      />
      <PasswordField
        id="password"
        value={password}
        onChange={onPasswordChange}
        error={fieldErrors.password}
      />
      <div className="odm-auth-row">
        <label className="odm-auth-checkbox">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => onRememberMeChange(event.target.checked)}
          />
          <span>{t.rememberMe}</span>
        </label>
        <button
          type="button"
          className="odm-auth-link-button"
          onClick={onForgotPassword}
        >
          {t.forgotPassword}
        </button>
      </div>
      <button
        type="submit"
        className="odm-btn odm-btn-p odm-auth-submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        <span>{isSubmitting ? t.signingIn : t.signIn}</span>
        {isSubmitting ? null : <Icon name="arrow-right" />}
      </button>
    </>
  )
}
