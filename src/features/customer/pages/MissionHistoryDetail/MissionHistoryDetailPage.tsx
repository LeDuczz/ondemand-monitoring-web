import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { PageHeader } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { CustomerDeliveryPanel } from '../../../delivery/CustomerDeliveryPanel'
import { MissionStatusBadge } from '../../components/common/MissionStatusBadge'
import type { MissionRow } from '../../lib/missionHistory/types'
import { customerHref } from '../../routes'
import { MissionInfoCard } from './components/MissionInfoCard'
import { MissionResults } from './components/MissionResults'
import { useMissionDetail } from './hooks/useMissionDetail'
import './MissionHistoryDetail.css'
import { missionHistoryDetailPageMessages } from './MissionHistoryDetailPage.messages'
import {
  MissionReportBanner,
  MissionReportBody,
  MissionReportFacts,
  MissionReportLayout,
  MissionReportState,
  useCustomerMissionReport,
} from '../../components/reports/CustomerMissionReportPage'
import { customerReportMessages } from '../../components/reports/messages'

/** One finished mission: `mission-history/{id}` plus its media and result counts. */
export function MissionHistoryDetailPage({ missionId }: { missionId: string }) {
  return <Detail key={missionId} missionId={missionId} />
}

function Detail({ missionId }: { missionId: string }) {
  const { t } = useI18n(missionHistoryDetailPageMessages)
  const detail = useMissionDetail(missionId)
  const mission = detail.mission.data

  if (detail.mission.loading && !mission) {
    return (
      <div className="mhd-page">
        <LoadingState />
      </div>
    )
  }
  if (!mission || detail.mission.error) {
    return (
      <div className="mhd-page">
        <div className="ui-page-back mhd-state-back">
          <a href={customerHref({ screen: 'missionHistory' })}>{t.backToHistory}</a>
        </div>
        <ErrorState
          title={t.errorTitle}
          error={undefined}
          onRetry={detail.mission.reload}
        />
      </div>
    )
  }

  return <MissionDetailBody mission={mission} detail={detail} />
}

/** Mounted once the mission is readable, so the report is only requested for owned missions. */
function MissionDetailBody({
  mission,
  detail,
}: {
  mission: MissionRow
  detail: ReturnType<typeof useMissionDetail>
}) {
  const { t } = useI18n(missionHistoryDetailPageMessages)
  const { t: reportT } = useI18n(customerReportMessages)
  const report = useCustomerMissionReport(mission.orderId, mission.id)

  return (
    <div className="mhd-page">
      <PageHeader
        back={
          <a href={customerHref({ screen: 'missionHistory' })}>
            {t.backToHistory}
          </a>
        }
        title={
          <span className="mhd-title">
            <span>{mission.orderTitle}</span>
            <MissionStatusBadge status={mission.status} />
          </span>
        }
        subtitle={mission.code}
        actions={
          <>
            <a
              className="odm-btn odm-btn-p mhd-btn"
              href={customerHref({ screen: 'orderDetail', orderId: mission.orderId })}
            >
              {t.viewOrder}
            </a>
            <button
              type="button"
              className="odm-btn odm-btn-gh mhd-btn"
              disabled={report.query.loading}
              onClick={report.query.reload}
            >
              {reportT.refresh}
            </button>
          </>
        }
      />
      <MissionReportBanner model={report} />
      <MissionReportLayout
        main={
          <>
            <MissionReportState model={report} />
            <MissionReportBody model={report} />
            <MissionResults detail={detail} missionCode={mission.code} />
            <CustomerDeliveryPanel orderId={mission.orderId} />
          </>
        }
        side={
          <>
            <MissionInfoCard mission={mission} />
            <MissionReportFacts model={report} compact />
          </>
        }
      />
    </div>
  )
}
