import { useI18n } from '../../../shared/i18n'
import { operatorHref } from '../routes'
import { handoverBannersMessages } from './HandoverBanners.messages'

export function RevokedBanner({ onReconfirm }: { onReconfirm: () => void }) {
  const { t } = useI18n(handoverBannersMessages)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'var(--red-bg)',
          color: 'var(--red-fg)',
          border: '1px solid var(--red-dot)',
        }}
      >
        <div>
          <span style={{ fontWeight: 700 }}>{t.revokedTitle}</span>{' '}
          {t.revokedBody}
        </div>
      </div>
      <div className="odm-card">
        <div
          className="odm-card-body"
          style={{
            padding: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t.statusTitle}</div>
            <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
              {t.revokedNote}
            </div>
          </div>
          <span className="odm-badge odm-badge-red odm-badge-lg">
            <span className="odm-badge-dot" aria-hidden="true" />
            {t.revokedBadge}
          </span>
        </div>
      </div>
      <button type="button" className="odm-btn odm-btn-p" onClick={onReconfirm}>
        {t.reconfirm}
      </button>
    </div>
  )
}

export function ConfirmedBanner({
  missionId,
  onRevoke,
}: {
  missionId?: string
  onRevoke: () => void
}) {
  const { t } = useI18n(handoverBannersMessages)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'var(--green-bg)',
          color: 'var(--green-fg)',
          border: '1px solid var(--green-dot)',
        }}
      >
        <span>{t.confirmedText}</span>
        <a
          className="odm-btn odm-btn-sm"
          href={operatorHref({ screen: 'flight', missionId })}
        >
          {t.continueToCockpit}
        </a>
      </div>
      {/* Demo-only affordance to exercise the REVOKED state without a real dispatcher action. */}
      <button
        type="button"
        className="odm-btn"
        style={{ alignSelf: 'flex-start', fontSize: 11.5, color: 'var(--tx3)' }}
        onClick={onRevoke}
      >
        {t.demoRevoke}
      </button>
    </div>
  )
}
