import type { ReactNode } from 'react'

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="odm-auth-field">
      <div className="odm-auth-field-label-row">
        <label htmlFor={htmlFor}>{label}</label>
        {hint ? <span>{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="odm-auth-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
