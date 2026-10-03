// MNG-08: Mission detail & result page (opened from the mission list).
import { useEffect, useState } from 'react'

import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { StateView } from '../../../shared/components/odm/StateView'
import { useI18n } from '../../../shared/i18n'
import { missionStatusTone } from '../../../shared/lib/statusTone'
import { staffMissionMediaReader } from '../api/missionMediaReader'
import { dronesApi } from '../api/dronesApi'
import { missionsApi } from '../api/missionsApi'
import { MissionUploadedMedia } from '../../media/components/MissionUploadedMedia'
import {
  CheckItemsList,
  DetailSection,
  MetricTile,
  PlanDetail,
  ResultDetail,
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
import {
  MissionRouteMap,
  waypointReasonLabel,
} from '../components/missionDetail/MissionRouteMap'
import { formatOrderCode } from '../components/orderReview/format'
import { OrderIcon } from '../components/orderReview/OrderIcon'
import { managerHref } from '../routes'
import { missionDetailPageMessages } from './MissionDetailPage.messages'
import '../manager.css'

export function MissionDetailPage({ missionId }: { missionId: string }) {
  const { t, locale } = useI18n(missionDetailPageMessages)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [droneLookup, setDroneLookup] = useState<string | null>(null)
  const [delivering, setDelivering] = useState(false)
  const [deliverError, setDeliverError] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'plan' | 'checks'>('overview')

  useEffect(() => {
    const abort = new AbortController()
    setLoading(true)
    setError(null)
    setDetail(null)
    Promise.allSettled([
      missionsApi.getMissionResponse(missionId, abort.signal),
      missionsApi.getCurrentPreflight(missionId, abort.signal),
      missionsApi.getCurrentPostDeviceCheck(missionId, abort.signal),
      missionsApi.getMissionResult(missionId, abort.signal),
      missionsApi.getMissionMedia(missionId, abort.signal),
    ])
      .then(([mission, preflight, postcheck, result, media]) => {
        if (abort.signal.aborted) return
        const fullMission = unwrapSettled(mission)
        if (!fullMission) {
          setError(
            mission.status === 'rejected' && mission.reason instanceof Error
              ? mission.reason.message
              : t.loadError,
          )
          return
        }
        setDetail({
          mission: fullMission,
          preflight: unwrapSettled(preflight),
          postcheck: unwrapSettled(postcheck),
          result: unwrapSettled(result),
          media: unwrapSettled(media) ?? [],
        })
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false)
      })
    return () => abort.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId])

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

  async function handleDeliverToCustomer() {
    if (!detail?.result) return
    setDelivering(true)
    setDeliverError(null)
    try {
      const mediaIds = [
        ...(detail.result.mediaFiles?.map((item) => item.id) ?? []),
        ...detail.media.map((item) => item.id),
      ].filter((id, index, all) => id && all.indexOf(id) === index)

      await Promise.allSettled(
        mediaIds.map((mediaId) => missionsApi.approveMissionMedia(missionId, mediaId)),
      )
      const approved = await missionsApi.approveMissionResult(detail.result.id)
      setDetail((current) =>
        current
          ? {
              ...current,
              result: approved,
            }
          : current,
      )
    } catch (cause) {
      setDeliverError(
        cause instanceof Error ? cause.message : 'Không gửi được kết quả cho customer.',
      )
    } finally {
      setDelivering(false)
    }
  }

  const backLink = (
    <a className="odm-or-back" href={managerHref({ screen: 'missions' })}>
      <OrderIcon name="arrow-right" size={14} />
      {t.back}
    </a>
  )

  if (loading) {
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
          <StateView state="error" title={t.loadError} error={error ?? undefined} />
        </section>
      </div>
    )
  }

  const plan = mission.plan ?? null
  const { preflight, postcheck } = detail
  const staff = mission.staffAssignments ?? []
  const accepted = staff.filter((s) => s.responseStatus === 'ACCEPTED').length
  const canSetup =
    mission.status === 'CREATED' || mission.status === 'RESOURCE_ASSIGNING'
  const deviceCode =
    mission.deviceCode ?? mission.droneCode ?? postcheck?.deviceCode ?? droneLookup ?? null
  const deviceName = mission.deviceName ?? postcheck?.deviceName ?? null
  const deviceLabel = deviceCode
    ? `${deviceCode}${deviceName && deviceName !== deviceCode ? ` · ${deviceName}` : ''}`
    : '—'
  const startedAt = mission.actualStartAt ?? mission.startedAt ?? detail.result?.startedAt ?? null
  const completedAt =
    mission.actualEndAt ??
    mission.completedAt ??
    detail.result?.endedAt ??
    detail.result?.completedAt ??
    null

  const rows: Array<{ label: string; value: string }> = [
    { label: t.fields.customer, value: mission.customerName || '—' },
    {
      label: t.fields.order,
      value: mission.orderCode ? formatOrderCode(mission.orderCode) : '—',
    },
    { label: t.fields.service, value: mission.serviceName ?? '—' },
    { label: t.kpi.drone, value: deviceLabel },
    {
      label: t.fields.scheduledStart,
      value: formatDateTime(mission.scheduledStartAt, locale),
    },
    {
      label: t.fields.scheduledEnd,
      value: formatDateTime(mission.scheduledEndAt ?? null, locale),
    },
    { label: t.fields.started, value: formatDateTime(startedAt, locale) },
    {
      label: t.fields.completed,
      value: formatDateTime(completedAt, locale),
    },
    { label: t.fields.address, value: mission.address ?? '—' },
    {
      label: t.fields.coordinates,
      value:
        mission.latitude !== null && mission.longitude !== null
          ? `${mission.latitude}, ${mission.longitude}`
          : '—',
    },
    { label: t.fields.mediaType, value: mission.mediaSummary ?? mission.mediaType ?? '—' },
  ]
  const failure = mission.failureReason ?? mission.rejectionReason
  if (failure) rows.push({ label: t.fields.failure, value: failure })

  const mediaCount =
    detail.result?.mediaCount ?? detail.result?.mediaFiles?.length ?? detail.media.length
  const kpis: Array<{ label: string; value: string }> = [
    { label: t.kpi.customer, value: mission.customerName || '—' },
    { label: t.kpi.schedule, value: formatDateTime(mission.scheduledStartAt, locale) },
    { label: t.kpi.drone, value: deviceLabel },
    {
      label: t.kpi.crew,
      value: staff.length > 0 ? t.crewAccepted(accepted, staff.length) : '—',
    },
    { label: t.kpi.media, value: String(mediaCount) },
    {
      label: detail.result?.durationSeconds != null ? t.kpi.actualDuration : t.kpi.plannedDuration,
      value: formatDuration(detail.result?.durationSeconds ?? plan?.plannedDurationSec),
    },
  ]
  const tabs: Array<{ id: typeof tab; label: string }> = [
    { id: 'overview', label: t.tabs.overview },
    { id: 'plan', label: t.tabs.plan },
    { id: 'checks', label: t.tabs.checks },
  ]
  const waypoints = [...(plan?.waypoints ?? [])].sort((a, b) => a.sequence - b.sequence)

  return (
    <div className="odm-or">
      {backLink}
      <div className="odm-or-pagehead odm-or-md-head">
        <div>
          <h1 className="odm-or-title odm-mono">{mission.missionCode}</h1>
          <p className="odm-or-subtitle">{mission.orderTitle}</p>
        </div>
        <div className="odm-or-md-actions">
          <StatusBadge
            kind="mission"
            status={mission.status}
            tone={missionStatusTone[mission.status]}
          />
          {canSetup ? (
            <a
              className="odm-or-btn odm-or-btn-blue"
              href={managerHref({ screen: 'missionSetup', missionId: mission.id })}
            >
              {t.continueSetup}
            </a>
          ) : null}
        </div>
      </div>

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
                aria-selected={tab === item.id}
                className={`odm-or-seg-btn${tab === item.id ? ' is-active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'overview' ? (
            <>
              <section className="odm-or-card odm-rm-card">
                <div className="odm-rm-stage">
                  <MissionRouteMap waypoints={waypoints} labels={{ ...t.map, drone: t.kpi.drone }} />
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
                    <li><i className="is-home" />{t.map.home}</li>
                    <li><i className="is-line" />{t.map.route}</li>
                    <li><i className="is-wp" />{t.map.waypoint}</li>
                    <li><i className="is-target" />{t.map.target}</li>
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

              <section className="odm-or-card">
                <div className="odm-or-card-body">
                  <DetailSection title={t.resultCard}>
                    <ResultDetail result={detail.result} media={[]} locale={locale} />
                    {detail.result ? (
                      <div className="odm-or-result-actions">
                        {deliverError ? (
                          <div className="odm-or-error">{deliverError}</div>
                        ) : null}
                        {detail.result.approvalStatus === 'APPROVED' ? (
                          <span className="odm-or-pill odm-or-pill-green">
                            {t.deliveredToCustomer}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="odm-or-btn odm-or-btn-blue"
                            onClick={handleDeliverToCustomer}
                            disabled={delivering}
                          >
                            {delivering ? t.deliveringToCustomer : t.deliverToCustomer}
                          </button>
                        )}
                      </div>
                    ) : null}
                  </DetailSection>
                </div>
              </section>

              <MissionUploadedMedia
                missionId={mission.id}
                reader={staffMissionMediaReader}
              />
            </>
          ) : null}

          {tab === 'plan' ? (
            <>
              <section className="odm-or-card">
                <div className="odm-or-card-body">
                  <DetailSection title={t.planCard} badge={plan?.feasibilityStatus}>
                    <PlanDetail plan={plan} postcheck={postcheck} precheckItems={preflight?.items} />
                  </DetailSection>
                </div>
              </section>
              <section className="odm-or-card">
                <div className="odm-or-card-body">
                  <DetailSection title={t.waypoints.title} badge={String(waypoints.length)}>
                    {waypoints.length === 0 ? (
                      <div className="odm-or-empty">{t.waypoints.empty}</div>
                    ) : (
                      <div className="odm-or-table-scroll">
                        <table className="odm-or-table">
                          <thead>
                            <tr>
                              <th>{t.waypoints.columns.seq}</th>
                              <th>{t.waypoints.columns.type}</th>
                              <th>{t.waypoints.columns.x}</th>
                              <th>{t.waypoints.columns.y}</th>
                              <th>{t.waypoints.columns.altitude}</th>
                              <th>{t.waypoints.columns.speed}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {waypoints.map((point) => (
                              <tr key={point.id}>
                                <td className="odm-mono">{point.sequence}</td>
                                <td>{waypointReasonLabel(point.reason)}</td>
                                <td className="odm-mono">{point.simX.toFixed(2)}</td>
                                <td className="odm-mono">{point.simY.toFixed(2)}</td>
                                <td>{formatNumber(point.altitudeM, ' m')}</td>
                                <td>{formatNumber(point.plannedSpeedMps, ' m/s')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </DetailSection>
                </div>
              </section>
            </>
          ) : null}

          {tab === 'checks' ? (
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
                          <MetricTile label={t.totalChecks} value={preflight.totalChecks} />
                          <MetricTile label={t.passed} value={preflight.passedChecks} />
                          <MetricTile label={t.failed} value={preflight.failedChecks} />
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
                          <MetricTile label={t.device} value={postcheck.deviceCode} />
                          <MetricTile
                            label={t.batteryLeft}
                            value={formatNumber(postcheck.landingBatteryPercent, '%')}
                          />
                          <MetricTile label={t.batteryState} value={postcheck.landingBatteryState} />
                          <MetricTile
                            label={t.checkedAt}
                            value={formatDateTime(postcheck.checkedAt, locale)}
                          />
                          <MetricTile label={t.passed} value={postcheck.passedChecks} />
                          <MetricTile label={t.failed} value={postcheck.failedChecks} />
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
              {mission.description ? (
                <p className="odm-or-detail-note">{mission.description}</p>
              ) : null}
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
                  <span style={{ width: `${(accepted / staff.length) * 100}%` }} />
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
                      <span className="odm-or-pill odm-or-pill-blue">{t.crewReserved}</span>
                    </li>
                  ) : null}
                  {staff.map((assignment) => {
                    const name =
                      assignment.staffName ?? assignment.staffEmail ?? assignment.staffId
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
