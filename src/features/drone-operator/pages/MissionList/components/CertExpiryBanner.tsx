import { useI18n } from '../../../../../shared/i18n'
import { operatorHref } from '../../../routes'
import { certExpiryBannerMessages } from './CertExpiryBanner.messages'

function formatVn(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

export function CertExpiryBanner({
  certExpiry,
  daysLeft,
}: {
  certExpiry: string
  daysLeft: number
}) {
  const { t } = useI18n(certExpiryBannerMessages)

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'var(--yellow-bg)',
          color: 'var(--yellow-fg)',
          border: '1px solid var(--yellow-dot)',
        }}
      >
        <div style={{ flex: 1 }}>
          <strong>{t.certExpiring(formatVn(certExpiry), daysLeft)}</strong>{' '}
          <span>{t.certExpiringHint}</span>
        </div>
        <a
          className="odm-btn odm-btn-sm"
          href={operatorHref({ screen: 'profile' })}
        >
          {t.viewProfile}
        </a>
      </div>
    </div>
  )
}
