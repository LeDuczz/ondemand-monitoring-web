import { useState } from 'react'

import { adminApi } from '../../api/adminApi'
import { useI18n } from '../../../../shared/i18n'
import type { AdminRole } from '../../types/roles'
import { deleteRoleDialogMessages } from './DeleteRoleDialog.messages'

export function DeleteRoleDialog({
  role,
  onClose,
  onSuccess,
}: {
  role: AdminRole
  onClose: () => void
  onSuccess: () => void
}) {
  const { t } = useI18n(deleteRoleDialogMessages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      await adminApi.deleteRole(role.id)
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
        style={{ maxWidth: 460 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">
            {role.userCount > 0
              ? t.cannotDeleteTitle(role.code)
              : t.deleteTitle}
          </h2>
          <button type="button" className="odm-dialog-close" onClick={onClose}>
            x
          </button>
        </div>
        <div
          className="odm-dialog-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {role.userCount > 0 ? (
            <div
              className="odm-adm-banner"
              style={{
                background: 'var(--red-bg)',
                color: 'var(--red-fg)',
                borderColor: 'var(--red-dot)',
                marginTop: 0,
              }}
            >
              <span style={{ fontWeight: 700 }}>
                {t.stillInUse(role.userCount)}
              </span>{' '}
              <span>{t.changeFirst}</span>
            </div>
          ) : (
            <p style={{ margin: 0 }}>
              {t.confirmPrefix} <strong>{role.name}</strong> ({role.code})?
            </p>
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
            {t.close}
          </button>
          {role.userCount === 0 && (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              style={{
                background: 'var(--red-solid)',
                borderColor: 'var(--red-solid)',
              }}
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? t.deleting : t.delete}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
