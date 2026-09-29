import type { ReactNode } from 'react'

export function FormField({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className="adm-form-field">
      <label htmlFor={id} className="adm-label">
        {label} {required && <span className="adm-required">*</span>}
      </label>
      {children}
      {error && <div className="adm-field-error">{error}</div>}
    </div>
  )
}
