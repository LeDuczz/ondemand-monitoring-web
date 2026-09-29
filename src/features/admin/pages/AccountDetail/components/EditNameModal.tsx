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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--bd)',
          borderRadius: 12,
          padding: 24,
          width: 360,
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>{t.editNameTitle}</h3>
        <input
          className="odm-input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setErr('')
          }}
          autoFocus
          style={{ marginBottom: 4 }}
        />
        {err && (
          <div
            style={{ fontSize: 12, color: 'var(--red-solid)', marginBottom: 8 }}
          >
            {err}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 12,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
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
