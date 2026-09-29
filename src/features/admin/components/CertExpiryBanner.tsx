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
    <div role="alert" className="adm-alert is-warning">
      <strong>{t.warning}</strong>
      <span>
        {t.summary(expiring.length)} {names}
      </span>
    </div>
  )
}
