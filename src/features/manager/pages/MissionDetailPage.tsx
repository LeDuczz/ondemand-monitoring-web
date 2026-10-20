// MNG-08: Mission detail & result page (opened from the mission list).
import { useEffect, useRef, useState } from 'react'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { checklistExecutionApi } from '../../mission/api/checklistExecutionApi'
import { MonitoringChecklistSection } from '../../mission/components/MonitoringChecklistSection'
import { MissionResultReviewCard } from '../components/missionDetail/MissionResultReviewCard'

import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { missionStopLabel } from '../../mission/lib/missionOperationalState'
import { StateView } from '../../../shared/components/odm/StateView'
import { useI18n } from '../../../shared/i18n'
import { missionStatusTone } from '../../../shared/lib/statusTone'
import { staffMissionMediaReader } from '../api/missionMediaReader'
import { dronesApi } from '../api/dronesApi'
import { missionsApi } from '../api/missionsApi'
import { assignmentReadiness } from '../lib/assignmentReadiness'
import { ordersApi } from '../api/ordersApi'
import { OrderAttachmentsCard } from '../components/orderReview/OrderAttachmentsCard'
import { OrderChecklistCard } from '../components/orderReview/OrderChecklistCard'
import { OrderCustomerCard } from '../components/orderReview/OrderCustomerCard'
import { OrderCustomerRequestDetails } from '../components/orderReview/OrderCustomerRequestDetails'
import { OrderServiceInfo } from '../components/orderReview/OrderServiceInfo'
import { MissionUploadedMedia } from '../../media/components/MissionUploadedMedia'
import { ManagerDeliveryPanel } from '../../delivery/ManagerDeliveryPanel'
import {
  CheckItemsList,
  DetailSection,
  MetricTile,
  STAFF_RESPONSE_LABELS,
  STAFF_ROLE_LABELS,
  assignmentTone,
  checkLabel,
  formatDateTime,
  formatDuration,
  formatNumber,
  initialsOf,
  unwrapSettled,
  type DetailData,
} from '../components/missionDetail/missionDetailParts'
import { waypointReasonLabel } from '../components/missionDetail/MissionRouteMap'
import { MissionSatelliteMap } from '../components/missionDetail/MissionSatelliteMap'
import { formatOrderCode } from '../components/orderReview/format'
import { OrderIcon } from '../components/orderReview/OrderIcon'
import { managerHref } from '../routes'
import { missionDetailPageMessages } from './MissionDetailPage.messages'
import { orderReviewPageMessages } from './OrderReviewPage.messages'
import '../manager.css'

type MissionDetailTab = 'overview' | 'order' | 'checks'

export function MissionDetailPage({ missionId }: { missionId: string }) {
  return <MissionDetail key={missionId} missionId={missionId} />
}

function MissionDetail({ missionId }: { missionId: string }) {
  const { t, locale } = useI18n(missionDetailPageMessages)
  const { t: orderT } = useI18n(orderReviewPageMessages)
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
    Promise.allSettled([
      missionsApi.getMissionResponse(missionId, abort.signal),
      missionsApi.getCurrentPreflight(missionId, abort.signal),
      missionsApi.getCurrentPostDeviceCheck(missionId, abort.signal),
      missionsApi.getMissionResult(missionId, abort.signal),
      missionsApi.getMissionMedia(missionId, abort.signal),
      missionsApi.getLatestWeatherCheck(missionId, abort.signal),
    ])
      .then(([mission, preflight, postcheck, result, media, weather]) => {
        if (abort.signal.aborted) return
        const fullMission = unwrapSettled(mission)
        if (!fullMission || fullMission.id !== missionId) {
          setError(t.loadError)
          return
        }
        setDetail({
          mission: fullMission,
          order: null,
          preflight: unwrapSettled(preflight),
          postcheck: unwrapSettled(postcheck),
          result:
            unwrapSettled(result)?.missionId === missionId
              ? unwrapSettled(result)
              : null,
          media: (unwrapSettled(media) ?? []).filter(
            (item) => item.missionId === missionId,
          ),
          weather: unwrapSettled(weather),
        })
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

  const backLink = (
    <a className="odm-or-back" href={managerHref({ screen: 'missions' })}>
      <OrderIcon name="arrow-right" size={14} />
      {t.back}
    </a>
  )

  if (loading && (!detail || detail.mission?.id !== missionId)) {
    return (
      <div className="odm-or" aria-busy="true">
        {backLink}
        <span className="odm-sk" style={{ width: '100%', height: 320 }} />
      </div>
    )
  }

  const mission = detail?.mission
  if (error || !mission || !detail) {
    return (
      <div className="odm-or">
        {backLink}
        <section className="odm-or-card">
          <StateView
            state="error"
            title={t.loadError}
            error={error ?? undefined}
          />
        </section>
      </div>
    )
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

  const rows: Array<{ label: string; value: string }> = [
    {
      label: t.fields.order,
      value: mission.orderCode ? formatOrderCode(mission.orderCode) : '—',
    },
    { label: t.fields.service, value: mission.serviceName ?? '—' },
    {
      label: t.fields.scheduledStart,
      value: formatDateTime(mission.scheduledStartAt, locale),
    },
    {
      label: t.fields.scheduledEnd,
      value: formatDateTime(mission.scheduledEndAt ?? null, locale),
    },
    {
      label: t.fields.started,
      value: startedAt ? formatDateTime(startedAt, locale) : t.notRecorded,
    },
    {
      label: t.fields.completed,
      value: completedAt ? formatDateTime(completedAt, locale) : t.notRecorded,
    },
    { label: t.fields.address, value: mission.address ?? '—' },
    {
      label: t.fields.coordinates,
      value:
        mission.latitude !== null && mission.longitude !== null
          ? `${mission.latitude}, ${mission.longitude}`
          : '—',
    },
    {
      label: t.fields.mediaType,
      value: mission.mediaSummary ?? mission.mediaType ?? '—',
    },
  ]
  const failure = mission.failureReason ?? mission.rejectionReason
  if (failure) rows.push({ label: t.fields.failure, value: failure })

  const mediaCount =
    detail.result?.mediaCount ??
    detail.result?.mediaFiles?.length ??
    detail.media.length
  const kpis: Array<{ label: string; value: string }> = [
    { label: t.kpi.customer, value: mission.customerName || '—' },
    {
      label: t.kpi.schedule,
      value: formatDateTime(mission.scheduledStartAt, locale),
    },
    { label: t.kpi.drone, value: deviceLabel },
    {
      label: t.kpi.crew,
      value: staff.length > 0 ? t.crewAccepted(accepted, staff.length) : '—',
    },
    { label: t.kpi.media, value: String(mediaCount) },
    detail.result?.durationSeconds != null
      ? {
          label: t.kpi.actualDuration,
          value: formatDuration(detail.result.durationSeconds),
        }
      : {
          label: t.kpi.duration,
          value:
            plan?.plannedDurationSec != null
              ? t.plannedSuffix(formatDuration(plan.plannedDurationSec))
              : t.notRecorded,
        },
  ]
  /** What the manager can do about this Mission right now. */
  const nextStep = missionNextStep(mission.status, accepted, staff.length)
  const isCompleted = mission.status === 'COMPLETED'
  const resultApproved = detail.result?.approvalStatus === 'APPROVED'
  const meaningfulText = (value: string | null | undefined) =>
    value && value.trim().length > 2 ? value.trim() : null
  const headline = meaningfulText(mission.orderTitle)
  const note = meaningfulText(mission.description)
  const checklistExecutions = checklist.data?.executions ?? []
  const compliantCount = checklistExecutions.filter(
    (item) => item.assessmentStatus === 'COMPLIANT',
  ).length
  const activeTab: MissionDetailTab = tab
  const tabs: Array<{ id: MissionDetailTab; label: string }> = [
    { id: 'overview', label: t.tabs.overview },
    { id: 'order', label: t.tabs.order },
    { id: 'checks', label: t.tabs.checks },
  ]
  const waypoints = [...(plan?.waypoints ?? [])].sort(
    (a, b) => a.sequence - b.sequence,
  )

  return (
    <div className="odm-or">
      {backLink}
      <div className="odm-or-pagehead odm-or-md-head">
        <div className="odm-md-headmain">
          <div className="odm-md-titlerow">
            <h1 className="odm-or-title odm-mono">{mission.missionCode}</h1>
            {missionStopLabel(mission) ? (
              <StatusBadge tone="yellow">
                {missionStopLabel(mission)}
              </StatusBadge>
            ) : (
              <StatusBadge
                kind="mission"
                status={mission.status}
                tone={missionStatusTone[mission.status]}
              />
            )}
          </div>
          <p className={`odm-or-subtitle${headline ? '' : ' is-muted'}`}>
            {headline ?? t.noDescription}
          </p>
          <div className="odm-md-meta">
            {mission.orderCode ? (
              <span>{formatOrderCode(mission.orderCode)}</span>
            ) : null}
            <span>{formatDateTime(mission.scheduledStartAt, locale)}</span>
            <a
              className="odm-or-btn-outline"
              href={managerHref({
                screen: 'orderReview',
                orderId: mission.orderId,
              })}
            >
              {t.viewOrderPlan}
              <OrderIcon name="arrow-right" size={13} />
            </a>
          </div>
        </div>
        {canSetup ? (
          <div className="odm-or-md-actions">
            <a
              className="odm-or-btn odm-or-btn-blue"
              href={managerHref({
                screen: 'missionSetup',
                missionId: mission.id,
              })}
            >
              {t.continueSetup}
            </a>
          </div>
        ) : null}
      </div>

      {nextStep ? (
        <div className={`odm-md-next is-${nextStep.tone}`} role="status">
          <strong>{nextStep.title}</strong>
          <span>{nextStep.detail}</span>
        </div>
      ) : null}

      <div className="odm-or-md-kpis">
        {kpis.map((item) => (
          <div key={item.label} className="odm-or-md-kpi">
            <span>{item.label}</span>
            <strong title={item.value}>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="odm-or-md-grid">
        <div className="odm-or-col">
          <div className="odm-or-seg" role="tablist" aria-label={t.tabsAria}>
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activeTab === item.id}
                className={`odm-or-seg-btn${activeTab === item.id ? ' is-active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' ? (
            <>
              {isCompleted ? (
                <>
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

                  {isCompleted && resultApproved ? (
                    <ManagerDeliveryPanel
                      orderId={mission.orderId}
                      refreshKey={revision}
                    />
                  ) : null}

                  <section
                    ref={mediaLibrary}
                    tabIndex={-1}
                    aria-label="Thư viện media"
                  >
                    <MissionUploadedMedia
                      missionId={mission.id}
                      missionStatus={mission.status}
                      reader={staffMissionMediaReader}
                      reviewStatus={detail.result?.approvalStatus ?? null}
                    />
                  </section>
                  {isCompleted && resultApproved ? (
                    <details className="odm-or-card odm-md-collapse">
                      <summary>
                        <span className="odm-md-collapse-title">
                          {t.checklistAcceptance}
                        </span>
                        <span className="odm-md-collapse-meta">
                          {checklistExecutions.length > 0
                            ? t.checklistCompliant(
                                compliantCount,
                                checklistExecutions.length,
                              )
                            : t.checklistLoading}
                        </span>
                        <span className="odm-or-pill odm-or-pill-green">
                          {t.checklistAccepted}
                        </span>
                      </summary>
                      <MonitoringChecklistSection
                        hideImplementationHints
                        missionId={mission.id}
                        data={
                          checklist.data?.missionId === missionId
                            ? checklist.data
                            : undefined
                        }
                        loading={checklist.loading}
                        error={
                          checklist.error
                            ? new Error(
                                'Không thể tải checklist của Mission này. Vui lòng thử lại.',
                              )
                            : undefined
                        }
                        resultStatus={detail.result?.approvalStatus}
                        resultNote={detail.result?.reviewNote}
                        refresh={() => {
                          checklist.reload()
                          refreshDetail()
                        }}
                      />
                    </details>
                  ) : (
                    <MonitoringChecklistSection
                      hideImplementationHints
                      missionId={mission.id}
                      data={
                        checklist.data?.missionId === missionId
                          ? checklist.data
                          : undefined
                      }
                      loading={checklist.loading}
                      error={
                        checklist.error
                          ? new Error(
                              'Không thể tải checklist của Mission này. Vui lòng thử lại.',
                            )
                          : undefined
                      }
                      resultStatus={detail.result?.approvalStatus}
                      resultNote={detail.result?.reviewNote}
                      refresh={() => {
                        checklist.reload()
                        refreshDetail()
                      }}
                    />
                  )}
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
                          <dt>{t.map.waypoint}</dt>
                          <dd>{waypoints.length}</dd>
                        </div>
                        <div>
                          <dt>{t.map.distance}</dt>
                          <dd>{formatNumber(plan?.plannedDistanceM, ' m')}</dd>
                        </div>
                        <div>
                          <dt>{t.map.altitude}</dt>
                          <dd>
                            {formatNumber(plan?.maxPlannedAltitudeM, ' m')}
                          </dd>
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
                              <strong>
                                {waypointReasonLabel(point.reason)}
                              </strong>
                              <span>{formatNumber(point.altitudeM, ' m')}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </section>
                </>
              ) : (
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
                          <dt>{t.map.waypoint}</dt>
                          <dd>{waypoints.length}</dd>
                        </div>
                        <div>
                          <dt>{t.map.distance}</dt>
                          <dd>{formatNumber(plan?.plannedDistanceM, ' m')}</dd>
                        </div>
                        <div>
                          <dt>{t.map.altitude}</dt>
                          <dd>
                            {formatNumber(plan?.maxPlannedAltitudeM, ' m')}
                          </dd>
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
                              <strong>
                                {waypointReasonLabel(point.reason)}
                              </strong>
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

                  {isCompleted && resultApproved ? (
                    <ManagerDeliveryPanel
                      orderId={mission.orderId}
                      refreshKey={revision}
                    />
                  ) : null}

                  <MonitoringChecklistSection
                    hideImplementationHints
                    missionId={mission.id}
                    data={
                      checklist.data?.missionId === missionId
                        ? checklist.data
                        : undefined
                    }
                    loading={checklist.loading}
                    error={
                      checklist.error
                        ? new Error(
                            'Không thể tải checklist của Mission này. Vui lòng thử lại.',
                          )
                        : undefined
                    }
                    resultStatus={detail.result?.approvalStatus}
                    resultNote={detail.result?.reviewNote}
                    refresh={() => {
                      checklist.reload()
                      refreshDetail()
                    }}
                  />
                  <section
                    ref={mediaLibrary}
                    tabIndex={-1}
                    aria-label="Thư viện media"
                  >
                    <MissionUploadedMedia
                      missionId={mission.id}
                      missionStatus={mission.status}
                      reader={staffMissionMediaReader}
                      reviewStatus={detail.result?.approvalStatus ?? null}
                    />
                  </section>
                </>
              )}
            </>
          ) : null}

          {activeTab === 'order' ? (
            detail.order ? (
              <div className="odm-or-order-review-stack">
                <OrderServiceInfo order={detail.order} t={orderT} />
                <OrderCustomerRequestDetails order={detail.order} t={orderT} />
                <OrderCustomerCard order={detail.order} t={orderT} />
                <OrderChecklistCard order={detail.order} t={orderT} />
                <OrderAttachmentsCard order={detail.order} t={orderT} />
              </div>
            ) : (
              <section className="odm-or-card">
                <div className="odm-or-card-body odm-or-empty">
                  {t.loadError}
                </div>
              </section>
            )
          ) : null}

          {activeTab === 'checks' ? (
            <>
              <section className="odm-or-card">
                <div className="odm-or-card-body">
                  <DetailSection
                    title={t.precheckCard}
                    badge={preflight ? checkLabel(preflight.status) : undefined}
                  >
                    {preflight ? (
                      <div className="odm-or-detail-stack">
                        <div className="odm-or-detail-grid">
                          <MetricTile
                            label={t.totalChecks}
                            value={preflight.totalChecks}
                          />
                          <MetricTile
                            label={t.passed}
                            value={preflight.passedChecks}
                          />
                          <MetricTile
                            label={t.failed}
                            value={preflight.failedChecks}
                          />
                          <MetricTile
                            label={t.progress}
                            value={formatNumber(preflight.progressPercent, '%')}
                          />
                        </div>
                        <CheckItemsList items={preflight.items} />
                      </div>
                    ) : (
                      <div className="odm-or-empty">{t.noPrecheck}</div>
                    )}
                  </DetailSection>
                </div>
              </section>
              <section className="odm-or-card">
                <div className="odm-or-card-body">
                  <DetailSection
                    title={t.postcheckCard}
                    badge={postcheck ? checkLabel(postcheck.status) : undefined}
                  >
                    {postcheck ? (
                      <div className="odm-or-detail-stack">
                        <div className="odm-or-detail-grid">
                          <MetricTile
                            label={t.device}
                            value={postcheck.deviceCode}
                          />
                          <MetricTile
                            label={t.batteryLeft}
                            value={formatNumber(
                              postcheck.landingBatteryPercent,
                              '%',
                            )}
                          />
                          <MetricTile
                            label={t.batteryState}
                            value={postcheck.landingBatteryState}
                          />
                          <MetricTile
                            label={t.checkedAt}
                            value={formatDateTime(postcheck.checkedAt, locale)}
                          />
                          <MetricTile
                            label={t.passed}
                            value={postcheck.passedChecks}
                          />
                          <MetricTile
                            label={t.failed}
                            value={postcheck.failedChecks}
                          />
                        </div>
                        <CheckItemsList items={postcheck.items} />
                      </div>
                    ) : (
                      <div className="odm-or-empty">{t.noPostcheck}</div>
                    )}
                  </DetailSection>
                </div>
              </section>
            </>
          ) : null}
        </div>

        <aside className="odm-or-col">
          <section className="odm-or-card">
            <header className="odm-or-card-head">
              <span className="odm-or-card-title">
                <OrderIcon name="doc" size={18} />
                {t.infoCard}
              </span>
            </header>
            <div className="odm-or-card-body">
              <dl className="odm-or-kv">
                {rows.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
              {note ? <p className="odm-or-detail-note">{note}</p> : null}
            </div>
          </section>

          <section className="odm-or-card">
            <header className="odm-or-card-head">
              <span className="odm-or-card-title">
                <OrderIcon name="users" size={18} />
                {t.crewCard}
              </span>
              {staff.length > 0 ? (
                <span className="odm-or-crew-count">
                  {t.crewAccepted(accepted, staff.length)}
                </span>
              ) : null}
            </header>
            <div className="odm-or-card-body">
              {staff.length > 0 ? (
                <div className="odm-or-crew-progress" aria-hidden="true">
                  <span
                    style={{ width: `${(accepted / staff.length) * 100}%` }}
                  />
                </div>
              ) : null}
              {deviceCode || staff.length > 0 ? (
                <ul className="odm-or-crew-list">
                  {deviceCode ? (
                    <li className="odm-or-crew-item">
                      <span className="odm-or-crew-avatar is-device">
                        <OrderIcon name="drone" size={16} />
                      </span>
                      <span className="odm-or-crew-main">
                        <span className="odm-or-crew-role">{t.crewDevice}</span>
                        <strong>{deviceLabel}</strong>
                      </span>
                      <span className="odm-or-pill odm-or-pill-blue">
                        {t.crewReserved}
                      </span>
                    </li>
                  ) : null}
                  {staff.map((assignment) => {
                    const name =
                      assignment.staffName ??
                      assignment.staffEmail ??
                      assignment.staffId
                    return (
                      <li key={assignment.id} className="odm-or-crew-item">
                        <span className="odm-or-crew-avatar" aria-hidden="true">
                          {initialsOf(name)}
                        </span>
                        <span className="odm-or-crew-main">
                          <span className="odm-or-crew-role">
                            {STAFF_ROLE_LABELS[assignment.assignedRole]}
                          </span>
                          <strong>{name}</strong>
                          {assignment.staffEmail && assignment.staffName ? (
                            <small>{assignment.staffEmail}</small>
                          ) : null}
                        </span>
                        <span
                          className={`odm-or-pill odm-or-pill-${assignmentTone(
                            assignment.responseStatus,
                          )}`}
                        >
                          {STAFF_RESPONSE_LABELS[assignment.responseStatus]}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="odm-or-empty">{t.crewEmpty}</div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

type NextStep = { tone: 'wait' | 'go' | 'done' | 'bad'; title: string; detail: string }

/** Plain-language "what is happening / what is next" for the manager, by Mission status. */
function missionNextStep(
  status: string,
  accepted: number,
  crew: number,
): NextStep | null {
  switch (status) {
    case 'RESOURCE_ASSIGNING':
      return { tone: 'go', title: 'Cần phân công nguồn lực', detail: 'Gán đủ nhân sự và thiết bị để Mission được gửi cho đội bay.' }
    case 'WAITING_CREW_CONFIRMATION':
    case 'WAITING_OPERATOR_ACCEPTANCE':
      return {
        tone: 'wait',
        title: 'Đang chờ đội bay xác nhận',
        detail: crew > 0 ? `${accepted}/${crew} nhân sự đã nhận. Mission sẽ được lên lịch khi tất cả xác nhận.` : 'Mission sẽ được lên lịch khi nhân sự xác nhận.',
      }
    case 'SCHEDULED':
      return { tone: 'wait', title: 'Đã lên lịch', detail: 'Đội bay sẽ kết nối thiết bị và kiểm tra trước chuyến bay.' }
    case 'FAILED_PREFLIGHT':
      return { tone: 'bad', title: 'Không đạt kiểm tra trước bay', detail: 'Xem tab Kết quả check, xử lý rồi cho đội bay kiểm tra lại.' }
    case 'PENDING_REVIEW':
      return { tone: 'go', title: 'Chờ duyệt kết quả', detail: 'Xem media và checklist rồi duyệt hoặc yêu cầu bổ sung.' }
    case 'FAILED':
    case 'CANCELLED':
      return { tone: 'bad', title: status === 'FAILED' ? 'Nhiệm vụ thất bại' : 'Nhiệm vụ đã hủy', detail: 'Có thể tạo Mission thay thế trong kế hoạch Order.' }
    default:
      return null
  }
}
