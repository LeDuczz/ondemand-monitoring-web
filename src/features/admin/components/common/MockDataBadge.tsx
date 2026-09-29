import { useI18n } from '../../../../shared/i18n'
import { mockDataBadgeMessages } from './MockDataBadge.messages'

/** Marks UI sections still backed by mock data (BE endpoint not available). */
export function MockDataBadge() {
  const { t } = useI18n(mockDataBadgeMessages)
  return (
    <span className="adm-mock-badge" title={t.tip}>
      {t.label}
    </span>
  )
}
