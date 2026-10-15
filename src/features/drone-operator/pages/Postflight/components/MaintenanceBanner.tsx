import { useI18n } from '../../../../../shared/i18n'
import { maintenanceBannerMessages } from './MaintenanceBanner.messages'

export function MaintenanceBanner({
  failCount,
  deviceLabel,
  ticketCreated,
  onAddDetails,
}: {
  failCount: number
  deviceLabel: string
  ticketCreated: boolean
  onAddDetails: () => void
}) {
  const { t } = useI18n(maintenanceBannerMessages)
  return failCount > 0 ? (
    <div
      style={{
        padding: '16px 20px',
        borderRadius: 14,
        background:
          'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.15) 100%)',
        border: '1.5px solid #f59e0b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#92400e' }}>
          {t.foundFailures(failCount)}
        </div>
        <div style={{ fontSize: 13, color: '#78350f', marginTop: 4 }}>
          {t.autoTicketNotePrefix} <b>{t.autoTicketNoteBold}</b>{' '}
          {t.autoTicketNoteMid} <b>{deviceLabel}</b> {t.autoTicketNoteSuffix}
        </div>
      </div>

      <button
        type="button"
        className="odm-btn"
        onClick={() => onAddDetails()}
        style={{
          background: '#f59e0b',
          color: '#fff',
          fontWeight: 700,
          fontSize: 13,
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          flex: 'none',
          cursor: 'pointer',
        }}
      >
        {ticketCreated ? t.detailsAdded : t.addMaintenanceDetails}
      </button>
    </div>
  ) : (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: 12,
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1.5px solid #10b981',
        fontSize: 13.5,
        color: '#065f46',
        fontWeight: 600,
      }}
    >
      {t.allPassNotePrefix} <b>{t.allPassNoteBold}</b> {t.allPassNoteSuffix}
    </div>
  )
}
