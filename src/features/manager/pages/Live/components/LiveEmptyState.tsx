import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { liveEmptyStateMessages } from './LiveEmptyState.messages'

export function LiveEmptyState() {
  const { t } = useI18n(liveEmptyStateMessages)
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--tx3)',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 40 }}>📡</div>
      <div style={{ fontWeight: 600 }}>{t.emptyState.selectMission}</div>
      <div style={{ fontSize: 13 }}>
        {t.emptyState.noFlying}{' '}
        <a
          href={managerHref({ screen: 'schedule' })}
          style={{ color: 'var(--focus)' }}
        >
          {t.emptyState.viewSchedule}
        </a>
      </div>
    </div>
  )
}
