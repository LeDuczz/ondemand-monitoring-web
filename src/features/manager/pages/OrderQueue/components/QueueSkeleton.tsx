import { useI18n } from '../../../../../shared/i18n'
import { queueSkeletonMessages } from './QueueSkeleton.messages'

export function QueueSkeleton() {
  const { t } = useI18n(queueSkeletonMessages)
  return (
    <div className="odm-or" aria-busy="true" aria-live="polite">
      <span className="odm-sk" style={{ width: 220, height: 28 }} />
      <div className="mng-stats">
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className="odm-sk" style={{ height: 76 }} />
        ))}
      </div>
      <span className="odm-sk mng-dash-sk" />
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
