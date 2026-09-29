import type { ReactNode } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { PageHeader } from '../../../components/common/PageHeader'
import {
  StatusBadge,
  toAdminTone,
} from '../../../components/common/StatusBadge'
import { getAccountStatusMeta } from '../../../lib/accountStatus'
import type { AdminAccountDetail } from '../../../types/accounts'
import { accountHeaderMessages } from './AccountHeader.messages'

export function AccountHeader({
  account,
  back,
  onEdit,
}: {
  account: AdminAccountDetail
  back?: ReactNode
  onEdit: () => void
}) {
  const { t, lang } = useI18n(accountHeaderMessages)
  const statusMeta = getAccountStatusMeta(account.status, lang)

  return (
    <PageHeader
        back={back}
        title={account.fullName}
        subtitle={account.email}
        actions={
          <>
            <StatusBadge tone={toAdminTone(statusMeta.tone)}>
              {statusMeta.label}
            </StatusBadge>
            <button
              type="button"
              className="odm-btn odm-btn-sm"
              onClick={onEdit}
            >
              {t.edit}
            </button>
          </>
        }
    />
  )
}
