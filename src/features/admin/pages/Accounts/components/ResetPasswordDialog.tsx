import { useI18n } from '../../../../../shared/i18n'
import { Modal } from '../../../components/common/Modal'
import type { AdminAccountItem } from '../../../types/accounts'
import { resetPasswordDialogMessages } from './ResetPasswordDialog.messages'

type Props = {
  account: AdminAccountItem
  onClose: () => void
}

// TODO(BE): no reset-password endpoint exists; the confirm action stays disabled.
export function ResetPasswordDialog({ account, onClose }: Props) {
  const { t } = useI18n(resetPasswordDialogMessages)

  return (
    <Modal
      width={440}
      tone="warning"
      icon="key"
      title={t.title}
      subtitle={account.email}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="odm-btn odm-btn-gh" onClick={onClose}>
            {t.cancel}
          </button>
          <button type="button" className="odm-btn odm-btn-p" disabled>
            {t.confirm}
          </button>
        </>
      }
    >
      <p style={{ margin: 0 }}>
        {t.confirmPrefix} <strong>{account.fullName}</strong>?
      </p>
      <div className="adm-modal-warning" role="note">
        <div>
          <strong>{t.unsupported}</strong>
          <div>{t.unsupportedHint}</div>
        </div>
      </div>
    </Modal>
  )
}
