import { EmptyState } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { scheduleEmptyStateMessages } from './ScheduleEmptyState.messages'

export function ScheduleEmptyState() {
  const { t } = useI18n(scheduleEmptyStateMessages)
  return (
    <EmptyState
      title={t.emptyTitle}
      description={t.emptyDescription}
      action={
        <a href="#portal/manager/orders" className="odm-btn">
          {t.backToQueue}
        </a>
      }
    />
  )
}
