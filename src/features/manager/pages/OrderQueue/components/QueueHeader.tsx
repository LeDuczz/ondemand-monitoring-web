import { useI18n } from '../../../../../shared/i18n'
import { queueHeaderMessages } from './QueueHeader.messages'

export function QueueHeader({ onRefresh }: { onRefresh: () => void }) {
  const { t } = useI18n(queueHeaderMessages)
  return (
    <div className="odm-mgr-dash-head">
      <div>
        <h1 className="odm-mgr-dash-title">{t.title}</h1>
      </div>
      <button type="button" className="odm-btn" onClick={onRefresh}>
        {t.refresh}
      </button>
    </div>
  )
}
