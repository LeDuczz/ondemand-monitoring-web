import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import { getAccountStatusMeta } from '../../../lib/accountStatus'
import type { AdminAccountDetail } from '../../../types/accounts'
import { accountHeaderMessages } from './AccountHeader.messages'

export function AccountHeader({
  account,
  onEditName,
}: {
  account: AdminAccountDetail
  onEditName: () => void
}) {
  const { t, lang } = useI18n(accountHeaderMessages)
  const statusMeta = getAccountStatusMeta(account.status, lang)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: account.avatarUrl ? undefined : 'var(--sf3)',
          backgroundImage: account.avatarUrl
            ? `url(${account.avatarUrl})`
            : undefined,
          backgroundSize: 'cover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 700,
          flex: 'none',
        }}
      >
        {!account.avatarUrl && (account.fullName[0] ?? '?').toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              minWidth: 0,
              overflowWrap: 'anywhere',
            }}
          >
            {account.fullName}
          </h1>
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            style={{
              fontSize: 11,
              padding: '3px 8px',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
            }}
            onClick={onEditName}
          >
            {t.changeName}
          </button>
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--tx3)',
            marginTop: 2,
            overflowWrap: 'anywhere',
          }}
        >
          {account.email}
        </div>
      </div>
      <StatusBadge tone={statusMeta.tone} size="lg">
        {statusMeta.label}
      </StatusBadge>
    </div>
  )
}
