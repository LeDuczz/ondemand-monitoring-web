import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import type { AdminAccountDetail } from '../../../types/accounts'
import { editNameModalMessages } from './EditNameModal.messages'

export function EditNameModal({
  account,
  onClose,
  onSaved,
}: {
  account: AdminAccountDetail
  onClose: () => void
  onSaved: (name: string) => void
}) {
  const { t } = useI18n(editNameModalMessages)
  const [value, setValue] = useState(account.fullName)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    const trimmed = value.trim()
    if (!trimmed) {
      setErr(t.required)
      return
    }
    setSaving(true)
    setErr('')
    try {
      await adminApi.updateAccount(account.id, { fullName: trimmed })
      onSaved(trimmed)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t.genericError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="odm-dialog-backdrop" onClick={onClose}>
      <div
        className="odm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t.editNameTitle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">{t.editNameTitle}</h2>
        </div>
        <div className="odm-dialog-body">
          <input
            className="odm-inp"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setErr('')
            }}
            autoFocus
          />
          {err && (
            <div className="adm-alert is-danger" role="alert">
              {err}
            </div>
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
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t.saving : t.save}
          </button>
        </div>
      </div>
    </div>
  )
}
