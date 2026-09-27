import { useState } from 'react'

import { adminApi } from '../api/adminApi'
import { useI18n } from '../../../shared/i18n'
import type { AdminAccountItem } from '../types/accounts'
import { resetPasswordDialogMessages } from './ResetPasswordDialog.messages'

type Props = {
  account: AdminAccountItem
  onClose: () => void
  onSuccess: () => void
}

export function ResetPasswordDialog({ account, onClose, onSuccess }: Props) {
  const { t } = useI18n(resetPasswordDialogMessages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await adminApi.resetPassword(account.id)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="odm-dialog-backdrop" onClick={onClose}>
      <div
        className="odm-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 400 }}
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
      >
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">{t.title}</h2>
          <button
            type="button"
            className="odm-dialog-close"
            onClick={onClose}
            aria-label={t.close}
          >
            x
          </button>
        </div>
        <div
          className="odm-dialog-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <p style={{ margin: 0, color: 'var(--tx)' }}>
            {t.confirmPrefix} <strong>{account.email}</strong>
            {t.confirmSuffix}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--tx2)' }}>
            {t.hint}
          </p>
          {error && (
            <p style={{ color: 'var(--red-solid)', fontSize: 13, margin: 0 }}>
              {error}
            </p>
          )}
        </div>
        <div className="odm-dialog-footer">
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            onClick={onClose}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? t.sending : t.send}
          </button>
        </div>
      </div>
    </div>
  )
}
