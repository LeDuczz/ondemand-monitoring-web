import { managerHref } from '../../../routes'
import type { OrderCreateResponse } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { queueSummaryHeaderMessages } from './QueueSummaryHeader.messages'

export function QueueSummaryHeader({
  data,
  onRefresh,
}: {
  data: OrderCreateResponse[]
  onRefresh: () => void
}) {
  const { t } = useI18n(queueSummaryHeaderMessages)
  return (
    <div className="odm-mgr-dash-head">
      <div>
        <h1 className="odm-mgr-dash-title">{t.title}</h1>
        <div className="odm-mgr-dash-date">{t.summary(data.length)}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <a
          className="odm-btn odm-btn-p"
          href={managerHref({ screen: 'missions' })}
          style={{ textDecoration: 'none' }}
        >
          {t.viewMissions}
        </a>
        <button type="button" className="odm-btn" onClick={onRefresh}>
          {t.refresh}
        </button>
      </div>
    </div>
  )
}
