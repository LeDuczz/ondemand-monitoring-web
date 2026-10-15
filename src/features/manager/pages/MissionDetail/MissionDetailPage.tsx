// MNG-08: Mission detail & result page (opened from the mission list).
import { useEffect, useRef, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { checklistExecutionApi } from '../../../mission/api/checklistExecutionApi'
import { useI18n } from '../../../../shared/i18n'
import { dronesApi } from '../../api/dronesApi'
import { assignmentReadiness } from '../../lib/assignmentReadiness'
import { ordersApi } from '../../api/ordersApi'
import { type DetailData } from '../../components/common/missionDetailHelpers'
import { fetchMissionDetail } from './fetchMissionDetail'
import { managerHref } from '../../routes'
import { missionDetailPageMessages } from './MissionDetailPage.messages'
import '../../manager.css'
import { MissionBackLink } from './components/MissionBackLink'
import { MissionDetailSkeleton } from './components/MissionDetailSkeleton'
import { MissionDetailError } from './components/MissionDetailError'
import { MissionDetailHeader } from './components/MissionDetailHeader'
import { MissionKpis } from './components/MissionKpis'
import {
  MissionDetailTabs,
  type MissionDetailTab,
} from './components/MissionDetailTabs'
import { OverviewTab } from './components/OverviewTab'
import { PlanTab } from './components/PlanTab'
import { OrderTab } from './components/OrderTab'
import { ChecksTab } from './components/ChecksTab'
import { MissionInfoCard } from './components/MissionInfoCard'
import { MissionCrewCard } from './components/MissionCrewCard'

export function MissionDetailPage({ missionId }: { missionId: string }) {
  return <MissionDetail key={missionId} missionId={missionId} />
}

function MissionDetail({ missionId }: { missionId: string }) {
  const { t } = useI18n(missionDetailPageMessages)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [droneLookup, setDroneLookup] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const checklist = useApiQuery(
    (signal) =>
      checklistExecutionApi.getMissionChecklistExecutions(missionId, signal),
    [missionId, revision],
  )
  const refreshDetail = () => setRevision((value) => value + 1)
  const [tab, setTab] = useState<MissionDetailTab>('overview')
  const mediaLibrary = useRef<HTMLElement>(null)

  useEffect(() => {
    const abort = new AbortController()
    setLoading(true)
    setError(null)
    fetchMissionDetail(missionId, abort.signal)
      .then((fullDetail) => {
        if (abort.signal.aborted) return
        const fullMission = fullDetail?.mission
        if (!fullDetail || !fullMission) {
          setError(t.loadError)
          return
        }
        setDetail(fullDetail)
        ordersApi
          .getOrder(fullMission.orderId, abort.signal)
          .then((order) => {
            if (abort.signal.aborted) return
            setDetail((current) =>
              current?.mission?.id === fullMission.id
                ? { ...current, order }
                : current,
            )
          })
          .catch(() => undefined)
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false)
      })
    return () => abort.abort()
  }, [missionId, revision, t.loadError])

  // Completed missions may no longer carry `droneCode`; resolve the device
  // from the post-check, then from the drone that captured the media.
  const droneIdForLookup =
    detail &&
    !detail.mission?.droneCode &&
    !detail.mission?.deviceCode &&
    !detail.postcheck?.deviceCode
      ? (detail.mission?.deviceId ??
        detail.mission?.droneId ??
        detail.media[0]?.droneId ??
        null)
      : null
  useEffect(() => {
    if (!droneIdForLookup) {
      setDroneLookup(null)
      return
    }
    const abort = new AbortController()
    dronesApi
      .getDrone(droneIdForLookup, abort.signal)
      .then((drone) => {
        if (!abort.signal.aborted) setDroneLookup(drone.serialNumber)
      })
      .catch(() => {
        if (!abort.signal.aborted) setDroneLookup(null)
      })
    return () => abort.abort()
  }, [droneIdForLookup])

  if (loading && (!detail || detail.mission?.id !== missionId)) {
    return <MissionDetailSkeleton />
  }

  const mission = detail?.mission
  if (error || !mission || !detail) {
    return <MissionDetailError error={error} />
  }

  const plan = mission.plan ?? null
  const { preflight, postcheck } = detail
  const staff = mission.staffAssignments ?? []
  const accepted = staff.filter((s) => s.responseStatus === 'ACCEPTED').length
  const canSetup = assignmentReadiness(mission).needsSetup
  const deviceCode =
    mission.deviceCode ??
    mission.droneCode ??
    postcheck?.deviceCode ??
    droneLookup ??
    null
  const deviceName = mission.deviceName ?? postcheck?.deviceName ?? null
  const deviceLabel = deviceCode
    ? `${deviceCode}${deviceName && deviceName !== deviceCode ? ` · ${deviceName}` : ''}`
    : '—'
  const startedAt =
    mission.actualStartAt ??
    mission.startedAt ??
    detail.result?.startedAt ??
    null
  const completedAt =
    mission.actualEndAt ??
    mission.completedAt ??
    detail.result?.endedAt ??
    detail.result?.completedAt ??
    null

  const showPlanTab = mission.status !== 'COMPLETED'
  const activeTab: MissionDetailTab =
    showPlanTab || tab !== 'plan' ? tab : 'overview'
  const waypoints = [...(plan?.waypoints ?? [])].sort(
    (a, b) => a.sequence - b.sequence,
  )

  return (
    <div className="odm-or">
      <MissionBackLink />
      <MissionDetailHeader mission={mission} canSetup={canSetup} />

      <MissionKpis
        mission={mission}
        deviceLabel={deviceLabel}
        staff={staff}
        accepted={accepted}
        detail={detail}
        plan={plan}
      />

      <a
        className="odm-or-btn-outline"
        href={managerHref({ screen: 'orderReview', orderId: mission.orderId })}
      >
        {t.openOrderPlan}
      </a>

      <div className="odm-or-md-grid">
        <div className="odm-or-col">
          <MissionDetailTabs
            showPlanTab={showPlanTab}
            activeTab={activeTab}
            setTab={setTab}
          />

          {activeTab === 'overview' ? (
            <OverviewTab
              mission={mission}
              deviceLabel={deviceLabel}
              waypoints={waypoints}
              plan={plan}
              detail={detail}
              checklist={checklist}
              loading={loading}
              refreshDetail={refreshDetail}
              mediaLibrary={mediaLibrary}
              missionId={missionId}
              revision={revision}
            />
          ) : null}

          {activeTab === 'plan' ? (
            <PlanTab
              plan={plan}
              postcheck={postcheck}
              preflight={preflight}
              waypoints={waypoints}
            />
          ) : null}

          {activeTab === 'order' ? <OrderTab detail={detail} /> : null}

          {activeTab === 'checks' ? (
            <ChecksTab
              detail={detail}
              preflight={preflight}
              postcheck={postcheck}
            />
          ) : null}
        </div>

        <aside className="odm-or-col">
          <MissionInfoCard
            mission={mission}
            deviceLabel={deviceLabel}
            startedAt={startedAt}
            completedAt={completedAt}
          />

          <MissionCrewCard
            staff={staff}
            accepted={accepted}
            deviceCode={deviceCode}
            deviceLabel={deviceLabel}
          />
        </aside>
      </div>
    </div>
  )
}
