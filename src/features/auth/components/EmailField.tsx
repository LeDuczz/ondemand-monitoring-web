import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { emailFieldMessages } from './EmailField.messages'
import { Field } from './Field'

export function EmailField({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const { t } = useI18n(emailFieldMessages)
  return (
    <Field label={t.label} htmlFor="email" error={error}>
      <div className="odm-auth-input-wrap">
        <Icon name="mail" />
        <input
          id="email"
          name="email"
          className={`odm-inp${error ? ' odm-inp-err' : ''}`}
          type="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t.placeholder}
          autoComplete="email"
          required
        />
      </div>
    </Field>
  )
}
