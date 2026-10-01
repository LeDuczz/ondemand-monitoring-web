// MNG-08: Mission list + detail panel
import { useEffect, useState } from 'react'
import { env } from '../../../config/env'

import { ApiError } from '../../../shared/api/httpClient'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { missionStatusTone } from '../../../shared/lib/statusTone'
import type { MissionStatus } from '../../../shared/types/domain'
import { missionsApi } from '../api/missionsApi'
import { ordersApi } from '../api/ordersApi'
import { formatOrderCode } from '../components/orderReview/format'
import { OrderIcon } from '../components/orderReview/OrderIcon'
import { localizeTimeslot } from '../lib/viLabels'
import { managerHref } from '../routes'
import { missionsListPageMessages } from './MissionsListPage.messages'
import type {
  MissionCalendarItem,
  MissionStaffAssignmentResponse,
} from '../types/missions'
import type { OrderCreateResponse } from '../types/orders'
import '../manager.css'

type StatusChip = 'ALL' | MissionStatus

type PageMessages = (typeof missionsListPageMessages)['vi']

function formatScheduled(
  start: string | null,
  end: string | null,
  locale: 'vi-VN' | 'en-US',
): string {
  if (!start) return '—'
  const d = new Date(start)
  const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
  const startTime = d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  if (!end) return `${dateStr} ${startTime}`
  const endD = new Date(end)
  const endTime = endD.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${dateStr} ${startTime}–${endTime}`
}

function formatOrderPreferredDate(order: OrderCreateResponse) {
  if (!order.preferredDateFrom) return '—'
  const d = new Date(order.preferredDateFrom)
  if (Number.isNaN(d.getTime())) return order.preferredDateFrom
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

const STAFF_ROLE_LABELS: Record<
  MissionStaffAssignmentResponse['assignedRole'],
  string
> = {
  PILOT: 'Phi công',
  OPERATOR: 'Vận hành',
  MAINTAINER: 'Bảo trì',
  INSPECTOR: 'Nghiệm thu',
}

const STAFF_RESPONSE_LABELS: Record<
  MissionStaffAssignmentResponse['responseStatus'],
  string
> = {
  PENDING: 'Chờ phản hồi',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
}

function assignmentTone(status: MissionStaffAssignmentResponse['responseStatus']) {
  if (status === 'ACCEPTED') return 'green'
  if (status === 'REJECTED') return 'red'
  return 'amber'
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatStaffSummary(assignments?: MissionStaffAssignmentResponse[]) {
  const active = assignments ?? []
  if (active.length === 0) return '—'
  const accepted = active.filter((item) => item.responseStatus === 'ACCEPTED').length
  return `${accepted}/${active.length} đã nhận`
}

type ApprovedOrdersSectionProps = {
  orders: OrderCreateResponse[]
  loading: boolean
  showEmpty: boolean
  t: PageMessages
}

function ApprovedOrdersSection({
  orders,
  loading,
  showEmpty,
  t,
}: ApprovedOrdersSectionProps) {
  if (loading) {
    return <span className="odm-sk" style={{ width: '100%', height: 110 }} />
  }

  if (orders.length === 0 && !showEmpty) return null

  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="clock" size={18} />
          {t.approvedOrders.title}
        </span>
        <span className="odm-or-pill odm-or-pill-amber">
          {t.approvedOrders.count(orders.length)}
        </span>
      </header>
      <div className="odm-or-card-body">
        <p className="odm-or-muted" style={{ margin: '0 0 12px' }}>
          {t.approvedOrders.description}
        </p>
        {orders.length === 0 ? (
          <div className="odm-or-empty">{t.approvedOrders.empty}</div>
        ) : (
          <div className="odm-or-order-list">
            {orders.map((order) => (
              <div key={order.id} className="odm-or-order-row">
                <div className="odm-or-order-main">
                  <div className="odm-or-order-title">
                    {order.title || order.serviceName}
                  </div>
                  <div className="odm-or-order-meta">
                    <span>{order.serviceName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatOrderPreferredDate(order)}</span>
                    {order.preferredTimeName ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{localizeTimeslot(order.preferredTimeName)}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="odm-or-order-actions">
                  <span className="odm-or-pill odm-or-pill-amber">
                    {t.approvedOrders.status}
                  </span>
                  <a
                    className="odm-or-btn odm-or-btn-sm odm-or-btn-blue"
                    href={managerHref({
                      screen: 'missionCreate',
                      orderId: order.id,
                    })}
                  >
                    {t.approvedOrders.action}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

type DetailPanelProps = {
  mission: MissionCalendarItem
  onClose: () => void
  onRetried: (newId: string) => void
  t: PageMessages
  locale: 'vi-VN' | 'en-US'
}

function DetailPanel({
  mission,
  onClose,
  onRetried,
  t,
  locale,
}: DetailPanelProps) {
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  async function handleRetry() {
    setRetrying(true)
    setRetryError(null)
    try {
      const result = await missionsApi.retryMission(mission.id)
      onRetried(result.newMissionId)
    } catch (e) {
      setRetryError(e instanceof Error ? e.message : t.retryError)
    } finally {
      setRetrying(false)
    }
  }

  const rows: Array<{ label: string; value: string }> = []
  if (mission.orderCode)
    rows.push({ label: t.fields.order, value: formatOrderCode(mission.orderCode) })
  if (mission.serviceLabel)
    rows.push({ label: t.fields.service, value: mission.serviceLabel })
  rows.push({
    label: t.fields.attempt,
    value: `#${mission.attemptNumber ?? 1}`,
  })
  rows.push({
    label: t.fields.schedule,
    value: formatScheduled(
      mission.scheduledStartAt,
      mission.scheduledEndAt,
      locale,
    ),
  })
  if (mission.droneCode)
    rows.push({
      label: t.fields.drone,
      value: `${mission.droneCode}${mission.droneName ? ` ${mission.droneName}` : ''}`,
    })
  if (mission.operatorName)
    rows.push({ label: t.fields.operator, value: mission.operatorName })
  if (mission.addressText)
    rows.push({ label: t.fields.address, value: mission.addressText })
  const staffAssignments = mission.staffAssignments ?? []
  const hasAssignedResources = Boolean(mission.droneCode) || staffAssignments.length > 0

  return (
    <aside className="odm-or-card odm-or-sidepanel">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title odm-mono">{mission.missionCode}</span>
        <button
          type="button"
          className="odm-or-icon-btn"
          onClick={onClose}
          aria-label={t.close}
        >
          <OrderIcon name="x" size={16} />
        </button>
      </header>
      <div className="odm-or-card-body" style={{ display: 'grid', gap: 14 }}>
        <div className="odm-or-panel-status">
          <StatusBadge
            kind="mission"
            status={mission.status}
            tone={missionStatusTone[mission.status]}
          />
          {(mission.status === 'CREATED' ||
            mission.status === 'RESOURCE_ASSIGNING') && (
            <a
              href={managerHref({
                screen: 'missionSetup',
                missionId: mission.id,
              })}
              className="odm-or-btn odm-or-btn-sm odm-or-btn-blue"
            >
              {t.dispatch}
            </a>
          )}
        </div>

        <dl className="odm-or-kv">
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>

        <section className="odm-or-crew">
          <div className="odm-or-crew-head">
            <span className="odm-or-crew-title">{t.assignments.title}</span>
            {staffAssignments.length > 0 ? (
              <span className="odm-or-crew-count">
                {formatStaffSummary(staffAssignments)}
              </span>
            ) : null}
          </div>
          {staffAssignments.length > 0 ? (
            <div className="odm-or-crew-progress" aria-hidden="true">
              <span
                style={{
                  width: `${
                    (staffAssignments.filter((i) => i.responseStatus === 'ACCEPTED')
                      .length /
                      staffAssignments.length) *
                    100
                  }%`,
                }}
              />
            </div>
          ) : null}

          {hasAssignedResources ? (
            <ul className="odm-or-crew-list">
              <li className="odm-or-crew-item">
                <span className="odm-or-crew-avatar is-device">
                  <OrderIcon name="drone" size={16} />
                </span>
                <span className="odm-or-crew-main">
                  <span className="odm-or-crew-role">{t.assignments.device}</span>
                  <strong>
                    {mission.droneCode
                      ? `${mission.droneCode}${mission.droneName ? ` ${mission.droneName}` : ''}`
                      : '—'}
                  </strong>
                </span>
                {mission.droneCode ? (
                  <span className="odm-or-pill odm-or-pill-blue">
                    {t.assignments.reserved}
                  </span>
                ) : null}
              </li>

              {staffAssignments.map((assignment) => {
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
            <div className="odm-or-empty">{t.assignments.empty}</div>
          )}
        </section>

        {mission.status === 'FAILED' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {retryError && <div className="odm-or-error">{retryError}</div>}
            <button
              type="button"
              className="odm-or-btn odm-or-btn-blue"
              disabled={
                retrying || (!env.useMockApi && import.meta.env.MODE !== 'test')
              }
              title={
                !env.useMockApi && import.meta.env.MODE !== 'test'
                  ? t.backendNotSupported
                  : undefined
              }
              onClick={handleRetry}
            >
              {retrying ? t.retrying : t.retry}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

type MissionsListPageProps = {
  missionId?: string
}

export function MissionsListPage({ missionId }: MissionsListPageProps) {
  const { t, locale } = useI18n(missionsListPageMessages)
  const [statusFilter, setStatusFilter] = useState<StatusChip>('ALL')
  const [selectedMission, setSelectedMission] =
    useState<MissionCalendarItem | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const statusChips: Array<{ value: StatusChip; label: string }> = [
    { value: 'ALL', label: t.statusChips.ALL },
    { value: 'IN_FLIGHT', label: t.statusChips.IN_FLIGHT },
    { value: 'COMPLETED', label: t.statusChips.COMPLETED },
    { value: 'FAILED', label: t.statusChips.FAILED },
    { value: 'CREATED', label: t.statusChips.CREATED },
  ]

  const query = useApiQuery(
    (signal) =>
      missionsApi.listMissions({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        signal,
      }),
    [statusFilter],
  )
  const approvedOrdersQuery = useApiQuery(
    (signal) => ordersApi.getApproved(signal),
    [],
  )

  const missions = query.data?.items ?? []
  const approvedOrders = approvedOrdersQuery.data ?? []
  const showApprovedOrders = statusFilter === 'ALL' || statusFilter === 'CREATED'

  useEffect(() => {
    if (missionId && missions.length > 0) {
      const found = missions.find((m) => m.id === missionId) ?? null
      setSelectedMission(found)
    }
  }, [missionId, missions])

  function handleRetried(newId: string) {
    query.reload()
    setNotice(t.retriedAlert(newId))
  }

  const columns = [
    t.columns.mission,
    t.columns.order,
    t.columns.attempt,
    t.columns.schedule,
    t.columns.drone,
    t.columns.operator,
    t.columns.status,
    '',
  ]

  return (
    <div className="odm-or">
      <div className="odm-or-pagehead">
        <h1 className="odm-or-title">{t.title}</h1>
        <p className="odm-or-subtitle">
          {!query.loading && !query.error
            ? t.missionCount(
                missions.length + (showApprovedOrders ? approvedOrders.length : 0),
              )
            : ' '}
        </p>
      </div>

      <div className="odm-or-filters" role="group" aria-label={t.title}>
        {statusChips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={`odm-or-filter${statusFilter === chip.value ? ' is-active' : ''}`}
            aria-pressed={statusFilter === chip.value}
            onClick={() => setStatusFilter(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {notice ? (
        <div role="status" className="odm-or-notice">
          <OrderIcon name="check" size={16} />
          {notice}
        </div>
      ) : null}

      <div className={`odm-or-list-layout${selectedMission ? ' has-panel' : ''}`}>
        <div className="odm-or-col">
          {showApprovedOrders && !approvedOrdersQuery.error && (
            <ApprovedOrdersSection
              orders={approvedOrders}
              loading={approvedOrdersQuery.loading}
              showEmpty={missions.length === 0}
              t={t}
            />
          )}

          {query.loading && (
            <div aria-busy="true">
              <span className="odm-sk" style={{ width: '100%', height: 260 }} />
            </div>
          )}

          {!query.loading && !!query.error && (
            <section className="odm-or-card">
              <div className="odm-or-card-body">
                <StateView
                  state="error"
                  title={t.loadError}
                  error={query.error}
                  onRetry={query.reload}
                />
                {query.error instanceof ApiError && (
                  <code
                    className="odm-mono"
                    style={{
                      display: 'block',
                      fontSize: 11,
                      color: 'var(--tx3)',
                      marginTop: 8,
                    }}
                  >
                    GET /api/missions · {query.error.status ?? '—'}
                  </code>
                )}
              </div>
            </section>
          )}

          {!query.loading && !query.error && missions.length === 0 && (
            <section className="odm-or-card">
              <StateView
                state="empty"
                title={t.emptyTitle}
                description={t.emptyDescription}
              />
            </section>
          )}

          {!query.loading && !query.error && missions.length > 0 && (
            <section className="odm-or-card odm-or-table-card">
              <div className="odm-or-table-scroll">
                <table className="odm-or-table">
                  <thead>
                    <tr>
                      {columns.map((label, index) => (
                        <th key={index}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {missions.map((m) => (
                      <tr
                        key={m.id}
                        className={selectedMission?.id === m.id ? 'is-selected' : undefined}
                        onClick={() =>
                          setSelectedMission(selectedMission?.id === m.id ? null : m)
                        }
                      >
                        <td className="odm-or-table-strong odm-mono">
                          {m.missionCode}
                        </td>
                        <td>{m.orderCode ? formatOrderCode(m.orderCode) : '—'}</td>
                        <td>#{m.attemptNumber ?? 1}</td>
                        <td>
                          {formatScheduled(m.scheduledStartAt, m.scheduledEndAt, locale)}
                        </td>
                        <td>
                          {m.droneCode
                            ? `${m.droneCode}${m.droneName ? ` ${m.droneName}` : ''}`
                            : '—'}
                        </td>
                        <td>{formatStaffSummary(m.staffAssignments)}</td>
                        <td>
                          <StatusBadge
                            kind="mission"
                            status={m.status}
                            tone={missionStatusTone[m.status]}
                          />
                        </td>
                        <td className="odm-or-table-action">
                          {(m.status === 'CREATED' ||
                            m.status === 'RESOURCE_ASSIGNING') && (
                            <a
                              className="odm-or-btn odm-or-btn-sm odm-or-btn-blue"
                              href={managerHref({
                                screen: 'missionSetup',
                                missionId: m.id,
                              })}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {t.continueSetup}
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {selectedMission && (
          <DetailPanel
            key={selectedMission.id}
            mission={selectedMission}
            onClose={() => setSelectedMission(null)}
            onRetried={handleRetried}
            t={t}
            locale={locale}
          />
        )}
      </div>
    </div>
  )
}

// Re-export missionId for ManagerApp
export type { MissionsListPageProps }
