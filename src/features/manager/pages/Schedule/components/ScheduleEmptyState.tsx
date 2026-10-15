import { useI18n } from '../../../../../shared/i18n'
import { scheduleEmptyStateMessages } from './ScheduleEmptyState.messages'

export function ScheduleEmptyState() {
  const { t } = useI18n(scheduleEmptyStateMessages)
  return (
    <div
      style={{
        padding: 40,
        textAlign: 'center',
        color: 'var(--tx3)',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
      <div style={{ fontWeight: 600 }}>{t.emptyTitle}</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>{t.emptyDescription}</div>
      <a
        href="#portal/manager/orders"
        className="odm-btn"
        style={{ marginTop: 12, display: 'inline-flex' }}
      >
        {t.backToQueue}
      </a>
    </div>
  )
}
