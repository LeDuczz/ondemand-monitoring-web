import { MissionSatelliteMap } from './MissionSatelliteMap'
import { DetailSection } from './DetailSection'
import { WeatherResultDetail } from './WeatherResultDetail'
import {
  formatNumber,
  type DetailData,
} from '../../../components/common/missionDetailHelpers'
import { waypointReasonLabel } from './MissionRouteMap'
import { MissionResultReviewCard } from '../../../components/common/MissionResultReviewCard'
import { MonitoringChecklistSection } from '../../../../mission/components/MonitoringChecklistSection'
import { MissionUploadedMedia } from '../../../../media/components/MissionUploadedMedia'
import { staffMissionMediaReader } from '../../../api/missionMediaReader'
import { missionsApi } from '../../../api/missionsApi'
import { ManagerDeliveryPanel } from '../../../../delivery/ManagerDeliveryPanel'
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
  revision: number
}) {
  const { t, locale } = useI18n(overviewTabMessages)
  return (
    <>
      <section className="odm-or-card odm-rm-card">
        <div className="odm-rm-stage">
          <MissionSatelliteMap
            missionId={mission.id}
            latitude={mission.latitude}
            longitude={mission.longitude}
          />
        </div>
        <div className="odm-rm-side">
          <h3>{t.map.title}</h3>
          <dl className="odm-or-kv">
            <div>
              <dt>{t.kpi.drone}</dt>
              <dd>{deviceLabel}</dd>
            </div>
            <div>
              <dt>{t.map.waypoint}</dt>
              <dd>{waypoints.length}</dd>
            </div>
            <div>
              <dt>{t.map.distance}</dt>
              <dd>{formatNumber(plan?.plannedDistanceM, ' m')}</dd>
            </div>
            <div>
              <dt>{t.map.altitude}</dt>
              <dd>{formatNumber(plan?.maxPlannedAltitudeM, ' m')}</dd>
            </div>
          </dl>
          <ul className="odm-rm-key">
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
            <ul className="odm-rm-wps">
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
                  <span>{formatNumber(point.altitudeM, ' m')}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

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

      <section className="odm-or-card">
        <div className="odm-or-card-body">
          <DetailSection title={t.weatherResultCard}>
            <WeatherResultDetail weather={detail.weather} locale={locale} />
          </DetailSection>
        </div>
      </section>

      <MonitoringChecklistSection
        hideImplementationHints
        missionId={mission.id}
        data={
          checklist.data?.missionId === missionId ? checklist.data : undefined
        }
        loading={checklist.loading}
        error={
          checklist.error ? new Error(t.khongTheTaiChecklistCua) : undefined
        }
        resultStatus={detail.result?.approvalStatus}
        resultNote={detail.result?.reviewNote}
        refresh={() => {
          checklist.reload()
          refreshDetail()
        }}
      />
      <section ref={mediaLibrary} tabIndex={-1} aria-label={t.mediaLibrary}>
        <MissionUploadedMedia
          missionId={mission.id}
          missionStatus={mission.status}
          reader={staffMissionMediaReader}
          reviewStatus={detail.result?.approvalStatus ?? null}
          approveMedia={async (mediaId) => {
            await missionsApi.approveMissionMedia(missionId, mediaId)
            refreshDetail()
          }}
        />
      </section>
      {mission.status === 'COMPLETED' ? (
        <ManagerDeliveryPanel orderId={mission.orderId} refreshKey={revision} />
      ) : null}
    </>
  )
}
