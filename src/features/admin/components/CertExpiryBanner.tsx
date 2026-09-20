import { daysDiff, fmtDate } from '../lib/accountStatus'
import type { AdminAccountItem } from '../types/accounts'

type Props = { accounts: AdminAccountItem[] }

export function CertExpiryBanner({ accounts }: Props) {
  const WARNING_DAYS = 30
  const expiring = accounts.filter((a) => {
    if (!a.certExpiry) return false
    const d = daysDiff(a.certExpiry)
    return d >= 0 && d <= WARNING_DAYS
  })
  if (expiring.length === 0) return null

  const names = expiring
    .map((a) => {
      const d = daysDiff(a.certExpiry!)
      return `${a.fullName} (còn ${d} ngày — hết hạn ${fmtDate(a.certExpiry!)})`
    })
    .join(', ')

  return (
    <div
      role="alert"
      style={{
        background: 'var(--yellow-solid)',
        color: '#7a4f00',
        border: '1px solid #d97706',
        borderRadius: 8,
        padding: '10px 16px',
        marginBottom: 16,
        fontSize: 13,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ fontWeight: 700, flexShrink: 0 }}>Canh bao:</span>
      <span>
        {expiring.length} phi cong co chung chi sap het han: {names}
      </span>
    </div>
  )
}
