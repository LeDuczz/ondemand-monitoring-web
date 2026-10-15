import { StatusBadge } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { staffStatusBadgeMessages } from './StaffStatusBadge.messages'

/** Availability badge shown on candidate rows. */
export function StaffStatusBadge() {
  const { t } = useI18n(staffStatusBadgeMessages)
  return <StatusBadge tone="success">{t.ready}</StatusBadge>
}
