import { PageHeader } from '../../../../../shared/components/ui'
import { formatDateTime } from '../../../lib/formatVnDateTime'
import { useI18n } from '../../../../../shared/i18n'
import { dashboardHeaderMessages } from './DashboardHeader.messages'

export function DashboardHeader({ now }: { now: Date }) {
  const { t, lang } = useI18n(dashboardHeaderMessages)
  return <PageHeader title={t.title} subtitle={formatDateTime(now, lang)} />
}
