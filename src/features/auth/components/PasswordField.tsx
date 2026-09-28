import { useState } from 'react'

import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { Field } from './Field'
import { passwordFieldMessages } from './PasswordField.messages'

export function PasswordField({
  id,
  value,
  onChange,
  label,
  hint,
  error,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  label?: string
  hint?: string
  error?: string
}) {
  const { t } = useI18n(passwordFieldMessages)
  const [visible, setVisible] = useState(false)
  return (
    <Field label={label ?? t.label} htmlFor={id} hint={hint} error={error}>
      <div className="odm-auth-input-wrap has-action">
        <Icon name="lock" />
        <input
          id={id}
          name={id}
          className={`odm-inp${error ? ' odm-inp-err' : ''}`}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={id === 'password' ? 'current-password' : 'new-password'}
          minLength={8}
          required
        />
        <button
          type="button"
          className="odm-auth-input-action"
          aria-label={visible ? t.hide : t.show}
          onClick={() => setVisible(!visible)}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} />
        </button>
      </div>
    </Field>
  )
}
