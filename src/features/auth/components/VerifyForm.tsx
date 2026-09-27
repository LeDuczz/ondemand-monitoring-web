import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { EmailField } from './EmailField'
import { Field } from './Field'
import { verifyFormMessages } from './VerifyForm.messages'

export function VerifyForm({
  email,
  onEmailChange,
  otpCode,
  onOtpCodeChange,
  fieldErrors,
  isSubmitting,
  onResendOtp,
}: {
  email: string
  onEmailChange: (value: string) => void
  otpCode: string
  onOtpCodeChange: (value: string) => void
  fieldErrors: Record<string, string>
  isSubmitting: boolean
  onResendOtp: () => void
}) {
  const { t } = useI18n(verifyFormMessages)
  return (
    <>
      <EmailField
        value={email}
        onChange={onEmailChange}
        error={fieldErrors.email}
      />
      <Field label={t.codeLabel} htmlFor="otpCode" hint={t.codeHint}>
        <div className="odm-auth-input-wrap">
          <Icon name="ticket" />
          <input
            id="otpCode"
            name="otpCode"
            className="odm-inp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otpCode}
            onChange={(event) =>
              onOtpCodeChange(event.target.value.replace(/\D/g, ''))
            }
            placeholder="000000"
            autoComplete="one-time-code"
            required
          />
        </div>
      </Field>
      <button
        type="submit"
        className="odm-btn odm-btn-p odm-auth-submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? t.verifying : t.verify}
      </button>
      <button
        type="button"
        className="odm-auth-resend"
        onClick={onResendOtp}
        disabled={isSubmitting}
      >
        {t.noCodeReceived} <strong>{t.resend}</strong>
      </button>
    </>
  )
}
