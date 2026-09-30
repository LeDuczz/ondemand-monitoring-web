import type { ReactNode } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { Card } from '../../../../../shared/components/ui'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { StatusBadge } from '../../../../../shared/components/ui'
import { fmtDate, fmtDateTime } from '../../../lib/accountStatus'
import type { AdminAccountDetail } from '../../../types/accounts'
import { accountInfoCardMessages } from './AccountInfoCard.messages'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="adm-field">
      <div className="adm-field-label">{label}</div>
      {children}
    </div>
  )
}

export function AccountInfoCard({ account }: { account: AdminAccountDetail }) {
  const { t, lang } = useI18n(accountInfoCardMessages)

  return (
    <Card title={t.accountInfo}>
      <div className="adm-fields">
        <Field label={t.idLabel}>
          <div className="adm-mono">{account.id}</div>
        </Field>
        <Field label={t.roleLabel}>
          <RoleBadge role={account.role} />
        </Field>
        <Field label={t.emailVerification}>
          <StatusBadge tone={account.emailVerified ? 'success' : 'warning'}>
            {account.emailVerified ? t.verified : t.unverified}
          </StatusBadge>
        </Field>
        <Field label={t.createdAt}>
          <div className="adm-mono">{fmtDate(account.createdAt, lang)}</div>
        </Field>
        <Field label={t.lastLogin}>
          <div className="adm-mono">
            {account.lastLoginAt ? fmtDateTime(account.lastLoginAt, lang) : '—'}
          </div>
        </Field>
        {account.linkedProviders.length > 0 && (
          <Field label={t.oauth}>
            <div>{account.linkedProviders.join(', ')}</div>
          </Field>
        )}
      </div>
    </Card>
  )
}
