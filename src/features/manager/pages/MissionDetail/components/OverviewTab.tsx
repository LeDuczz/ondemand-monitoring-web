import { MissionSatelliteMap } from './MissionSatelliteMap'
import {
  formatNumber,
  type DetailData,
} from '../../../components/common/missionDetailHelpers'
import { waypointReasonLabel } from './waypointReason'
import { MissionResultReviewCard } from '../../../components/common/MissionResultReviewCard'
import { MonitoringChecklistSection } from '../../../../mission/components/MonitoringChecklistSection'
import { MissionUploadedMedia } from '../../../../media/components/MissionUploadedMedia'
import { staffMissionMediaReader } from '../../../api/missionMediaReader'
import { ManagerDeliveryPanel } from '../../../../delivery/ManagerDeliveryPanel'
import { Card, StatusBadge } from '../../../../../shared/components/ui'
import type { MissionResponse } from '../../../types/missions'
import type { MissionPlanResponse } from '../../../types/missions'
import type { PlanWaypointResponse } from '../../../types/missions'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { MissionChecklistResponse } from '../../../../mission/types/checklistExecution'
import type { RefObject } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { overviewTabMessages } from './OverviewTab.messages'

export function OverviewTab({
  mission,
  deviceLabel,
  waypoints,
  plan,
  detail,
  checklist,
  loading,
  refreshDetail,
  mediaLibrary,
  missionId,
  revision,
}: {
  mission: MissionResponse
  deviceLabel: string
  waypoints: PlanWaypointResponse[]
  plan: MissionPlanResponse | null
  detail: DetailData
  checklist: UseApiQueryState<MissionChecklistResponse>
  loading: boolean
  refreshDetail: () => void
  mediaLibrary: RefObject<HTMLElement | null>
  missionId: string
  /** Bumped after every refresh so the delivery panel reloads too. */
  revision: number
}) {
  const { t, locale, lang } = useI18n(overviewTabMessages)
  const facts: Array<{ label: string; value: string | number }> = [
    { label: t.kpi.drone, value: deviceLabel },
    { label: t.map.waypoint, value: waypoints.length },
    {
      label: t.map.distance,
      value: formatNumber(plan?.plannedDistanceM, ' m', lang),
    },
    {
      label: t.map.altitude,
      value: formatNumber(plan?.maxPlannedAltitudeM, ' m', lang),
    },
  ]
  const isCompleted = mission.status === 'COMPLETED'
  const resultApproved = detail.result?.approvalStatus === 'APPROVED'
  const executions = checklist.data?.executions ?? []
  const compliantCount = executions.filter(
    (item) => item.assessmentStatus === 'COMPLIANT',
  ).length
  const mapCard = (
    <Card title={t.map.title}>
      <div className="odm-md-map">
        <MissionSatelliteMap
          missionId={mission.id}
          latitude={mission.latitude}
          longitude={mission.longitude}
        />
      </div>
      <dl className="odm-md-facts">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      <ul className="odm-md-legend">
        <li>
          <i className="is-home" />
          {t.map.home}
        </li>
        <li>
          <i className="is-line" />
          {t.map.route}
        </li>
        <li>
          <i className="is-wp" />
          {t.map.waypoint}
        </li>
        <li>
          <i className="is-target" />
          {t.map.target}
        </li>
      </ul>
      {waypoints.length > 0 ? (
        <ul className="odm-md-wps">
          {waypoints.map((point, index) => (
            <li key={point.id}>
              <b>
                {index === 0
                  ? 'H'
                  : index === waypoints.length - 1
                    ? 'T'
                    : point.sequence}
              </b>
              <strong>{waypointReasonLabel(point.reason)}</strong>
              <span>{formatNumber(point.altitudeM, ' m', lang)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  )
  const resultCard = (
    <MissionResultReviewCard
      mission={mission}
      result={detail.result}
      checklist={checklist.data}
      checklistLoading={checklist.loading}
      checklistFailed={!!checklist.error}
      refreshing={loading}
      mediaCount={detail.media.length}
      locale={locale}
      onReviewed={refreshDetail}
      onViewMedia={() => {
        mediaLibrary.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
        mediaLibrary.current?.focus({ preventScroll: true })
      }}
    />
  )
  const mediaSection = (
    <section ref={mediaLibrary} tabIndex={-1} aria-label={t.mediaLibrary}>
      <MissionUploadedMedia
        missionId={mission.id}
        missionStatus={mission.status}
        reader={staffMissionMediaReader}
        reviewStatus={detail.result?.approvalStatus ?? null}
      />
    </section>
  )
  const checklistSection = (
    <MonitoringChecklistSection
      hideImplementationHints
      missionId={mission.id}
      data={
        checklist.data?.missionId === missionId ? checklist.data : undefined
      }
      loading={checklist.loading}
      error={checklist.error ? new Error(t.khongTheTaiChecklistCua) : undefined}
      resultStatus={detail.result?.approvalStatus}
      resultNote={detail.result?.reviewNote}
      refresh={() => {
        checklist.reload()
        refreshDetail()
      }}
    />
  )
  const deliveryPanel =
    isCompleted && resultApproved ? (
      <ManagerDeliveryPanel orderId={mission.orderId} refreshKey={revision} />
    ) : null
  if (isCompleted)
    return (
      <>
        {resultCard}
        {deliveryPanel}
        {mediaSection}
        {resultApproved ? (
          <details className="odm-md-collapse">
            <summary>
              <span className="odm-md-collapse-title">
                {t.checklistAcceptance}
              </span>
              <span className="odm-md-collapse-meta">
                {executions.length > 0
                  ? t.checklistCompliant(compliantCount, executions.length)
                  : t.checklistLoading}
              </span>
              <StatusBadge tone="success">{t.checklistAccepted}</StatusBadge>
            </summary>
            {checklistSection}
          </details>
        ) : (
          checklistSection
        )}
        {mapCard}
      </>
    )
  return (
    <>
      {mapCard}
      {resultCard}
      {checklistSection}
      {mediaSection}
    </>
  )
}
