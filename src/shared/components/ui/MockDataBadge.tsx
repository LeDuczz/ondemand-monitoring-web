import { useI18n } from '../../i18n'
import { mockDataBadgeMessages } from './MockDataBadge.messages'

/** Marks UI sections still backed by mock data (BE endpoint not available). */
export function MockDataBadge() {
  const { t } = useI18n(mockDataBadgeMessages)
  return (
    <span className="ui-mock-badge" title={t.tip}>
      {t.label}
    </span>
  )
}
