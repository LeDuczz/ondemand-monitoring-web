import { PageHeader } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { formatOrderCode } from '../../../components/common/format'
import { managerHref } from '../../../routes'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan } from '../../../types/planning'
import type { OrderMissionBrief } from '../../../types/orders'
import { PlanStatusBadges } from './PlanStatusBadges'
import { missionCreateHeaderMessages } from './MissionCreateHeader.messages'

/** Back link, title with order code and plan-status badge. */
export function MissionCreateHeader({
  orderId,
  brief,
  planQuery,
  planRevision,
}: {
  orderId: string
  brief: OrderMissionBrief
  planQuery: UseApiQueryState<ExecutionPlan>
  planRevision: number
}) {
  const { t } = useI18n(missionCreateHeaderMessages)
  return (
    <PageHeader
      back={
        <a href={managerHref({ screen: 'orderReview', orderId })}>{t.back}</a>
      }
      title={t.title}
      subtitle={t.fromOrder(
        formatOrderCode(brief.code),
        brief.serviceName,
        brief.customerFullName,
      )}
      actions={
        <PlanStatusBadges
          status={planQuery.data?.planStatus}
          revision={planRevision}
          loading={planQuery.loading}
        />
      }
    />
  )
}
