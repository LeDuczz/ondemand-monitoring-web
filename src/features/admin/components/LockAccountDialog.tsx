import { useState } from 'react'

import { adminApi } from '../api/adminApi'
import { useI18n } from '../../../shared/i18n'
import type { AdminAccountItem } from '../types/accounts'
import { lockAccountDialogMessages } from './LockAccountDialog.messages'

type Props = {
  account: AdminAccountItem
  onClose: () => void
  onSuccess: () => void
}

export function LockAccountDialog({ account, onClose, onSuccess }: Props) {
  const { t } = useI18n(lockAccountDialogMessages)
  const isLocked = account.status === 'INACTIVE'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      if (isLocked) {
        await adminApi.activateAccount(account.id)
      } else {
        await adminApi.deactivateAccount(account.id)
      }
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
        aria-label={isLocked ? t.unlockTitle : t.lockTitle}
      >
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">
            {isLocked ? t.unlockTitle : t.lockTitle}
          </h2>
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
            {isLocked ? (
              <>
                {t.unlockConfirmPrefix} <strong>{account.fullName}</strong>
                {t.unlockConfirmSuffix}
              </>
            ) : (
              <>
                {t.lockConfirmPrefix} <strong>{account.fullName}</strong>
                {t.lockConfirmSuffix}
              </>
            )}
          </p>
          {!isLocked && (
            <div
              style={{
                background: 'var(--yellow-solid)',
                color: '#7a4f00',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 12,
              }}
            >
              {t.lockWarning}
            </div>
          )}
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
            style={!isLocked ? { background: 'var(--red-solid)' } : {}}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? t.processing : isLocked ? t.unlockAction : t.lockAction}
          </button>
        </div>
      </div>
    </div>
  )
}
