import type { ReactNode } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { fmtDate, fmtDateTime, getRoleLabel } from '../../../lib/accountStatus'
import type { AdminAccountDetail } from '../../../types/accounts'
import { accountInfoCardMessages } from './AccountInfoCard.messages'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
      <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

const MONO = { fontFamily: 'var(--font-mono)', fontSize: 12 } as const

export function AccountInfoCard({ account }: { account: AdminAccountDetail }) {
  const { t, lang } = useI18n(accountInfoCardMessages)

  return (
    <div
      style={{
        background: 'var(--sf)',
        border: '1px solid var(--bd)',
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 16,
      }}
    >
      <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>
        {t.accountInfo}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '10px 24px',
        }}
      >
        <Field label={t.idLabel}>
          <div style={MONO}>{account.id}</div>
        </Field>
        <Field label={t.roleLabel}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {getRoleLabel(account.role, lang) ?? account.role}
          </div>
        </Field>
        <Field label={t.emailVerification}>
          <div style={{ fontSize: 13 }}>
            {account.emailVerified ? (
              <span style={{ color: 'var(--green-solid)' }}>{t.verified}</span>
            ) : (
              <span style={{ color: 'var(--yellow-solid)' }}>
                {t.unverified}
              </span>
            )}
          </div>
        </Field>
        <Field label={t.createdAt}>
          <div style={MONO}>{fmtDate(account.createdAt, lang)}</div>
        </Field>
        <Field label={t.lastLogin}>
          <div style={MONO}>
            {account.lastLoginAt ? fmtDateTime(account.lastLoginAt, lang) : '—'}
          </div>
        </Field>
        {account.linkedProviders.length > 0 && (
          <Field label={t.oauth}>
            <div style={{ fontSize: 12 }}>
              {account.linkedProviders.join(', ')}
            </div>
          </Field>
        )}
      </div>
    </div>
  )
}
