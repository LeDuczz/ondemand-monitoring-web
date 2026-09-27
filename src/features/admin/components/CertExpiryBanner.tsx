import { daysDiff, fmtDate } from '../lib/accountStatus'
import { useI18n } from '../../../shared/i18n'
import type { AdminAccountItem } from '../types/accounts'
import { certExpiryBannerMessages } from './CertExpiryBanner.messages'

type Props = { accounts: AdminAccountItem[] }

export function CertExpiryBanner({ accounts }: Props) {
  const { t, lang } = useI18n(certExpiryBannerMessages)
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
      return `${a.fullName} (${t.daysLeft(d, fmtDate(a.certExpiry!, lang))})`
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
      <span style={{ fontWeight: 700, flexShrink: 0 }}>{t.warning}</span>
      <span>
        {t.summary(expiring.length)} {names}
      </span>
    </div>
  )
}
