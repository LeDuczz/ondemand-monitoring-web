import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { adminUsersApi } from '../../../api/adminUsersApi'
import { Modal } from '../../../components/common/Modal'
import type { AdminAccountItem } from '../../../types/accounts'
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
      await adminUsersApi.updateUserStatus(account.id, { active: isLocked })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      width={440}
      tone={isLocked ? 'success' : 'danger'}
      icon="lock"
      title={isLocked ? t.unlockTitle : t.lockTitle}
      subtitle={account.email}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="odm-btn odm-btn-gh" onClick={onClose}>
            {t.cancel}
          </button>
          <button
            type="button"
            className={`odm-btn ${isLocked ? 'odm-btn-p' : 'is-danger'}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? t.processing : isLocked ? t.unlockAction : t.lockAction}
          </button>
        </>
      }
    >
      <p style={{ margin: 0 }}>
        {isLocked ? t.unlockConfirmPrefix : t.lockConfirmPrefix}{' '}
        <strong>{account.fullName}</strong>
        {isLocked ? t.unlockConfirmSuffix : t.lockConfirmSuffix}
      </p>
      {!isLocked && <div className="adm-modal-warning">{t.lockWarning}</div>}
      {error && (
        <div role="alert" className="adm-alert is-danger">
          {error}
        </div>
      )}
    </Modal>
  )
}
