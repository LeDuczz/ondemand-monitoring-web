import type { ReactNode } from 'react'
import { viCheckMessage, viCheckName } from '../../../../shared/lib/checkText'

import type {
  MediaResponse,
  MissionPlanResponse,
  MissionResponse,
  MissionResultResponse,
  MissionStaffAssignmentResponse,
  PersistedPostDeviceCheckResponse,
  PersistedPreflightCheckResponse,
  PostDeviceCheckItem,
  PreflightCheckItem,
} from '../../types/missions'

export function formatDateTime(
  value: string | null | undefined,
  locale: 'vi-VN' | 'en-US',
) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)}${suffix}`
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return '—'
  if (seconds < 60) return `${Math.round(seconds)} giây`
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return rest > 0 ? `${minutes} phút ${rest} giây` : `${minutes} phút`
}

export function checkTone(status: string | null | undefined) {
  if (status === 'PASSED' || status === 'APPROVED' || status === 'COMPLETED')
    return 'green'
  if (status === 'FAILED' || status === 'REJECTED') return 'red'
  if (status === 'CHECKING' || status === 'IN_PROGRESS') return 'blue'
  return 'amber'
}

export function checkLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    PASSED: 'Đạt',
    FAILED: 'Không đạt',
    PENDING: 'Chờ kiểm tra',
    CHECKING: 'Đang kiểm tra',
    CANCELLED: 'Đã hủy',
    COMPLETED: 'Hoàn thành',
    IN_PROGRESS: 'Đang xử lý',
    DRAFT: 'Nháp',
    PENDING_MANAGER_APPROVAL: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
  }
  return status ? (labels[status] ?? status) : '—'
}

export const STAFF_ROLE_LABELS: Record<
  MissionStaffAssignmentResponse['assignedRole'],
  string
> = {
  PILOT: 'Phi công',
  OPERATOR: 'Vận hành',
  MAINTAINER: 'Bảo trì',
  INSPECTOR: 'Nghiệm thu',
}

export const STAFF_RESPONSE_LABELS: Record<
  MissionStaffAssignmentResponse['responseStatus'],
  string
> = {
  PENDING: 'Chờ phản hồi',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
}

export function assignmentTone(status: MissionStaffAssignmentResponse['responseStatus']) {
  if (status === 'ACCEPTED') return 'green'
  if (status === 'REJECTED') return 'red'
  return 'amber'
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
}

export type DetailData = {
  mission: MissionResponse | null
  preflight: PersistedPreflightCheckResponse | null
  postcheck: PersistedPostDeviceCheckResponse | null
  result: MissionResultResponse | null
  media: MediaResponse[]
}

export function unwrapSettled<T>(value: PromiseSettledResult<T>): T | null {
  return value.status === 'fulfilled' ? value.value : null
}

export function MetricTile({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) {
  return (
    <div className="odm-or-detail-metric">
      <span>{label}</span>
      <strong>{value ?? '—'}</strong>
    </div>
  )
}

export function DetailSection({
  title,
  badge,
  children,
}: {
  title: string
  badge?: string
  children: ReactNode
}) {
  return (
    <section className="odm-or-detail-section">
      <header className="odm-or-detail-section-head">
        <h3>{title}</h3>
        {badge ? <span className="odm-or-pill odm-or-pill-blue">{badge}</span> : null}
      </header>
      {children}
    </section>
  )
}

export function CheckItemsList({
  items,
}: {
  items: Array<PreflightCheckItem | PostDeviceCheckItem>
}) {
  if (items.length === 0) {
    return <div className="odm-or-empty">Chưa có hạng mục kiểm tra.</div>
  }
  return (
    <ul className="odm-or-check-list">
      {items.map((item) => (
        <li key={`${item.checkType}-${item.checkName}`} className="odm-or-check-item">
          <span className={`odm-or-dot is-${checkTone(item.status)}`} />
          <span>
            <strong>{viCheckName(item.checkName)}</strong>
            {item.message ? <small>{viCheckMessage(item.message)}</small> : null}
          </span>
          <span className={`odm-or-pill odm-or-pill-${checkTone(item.status)}`}>
            {checkLabel(item.status)}
          </span>
        </li>
      ))}
    </ul>
  )
}

function batteryFromPrecheck(items?: PreflightCheckItem[] | null): number | null {
  const item = items?.find((it) => /battery/i.test(`${it.checkType} ${it.checkName}`))
  const match = item?.message?.match(/(\d+(?:[.,]\d+)?)\s*%/)
  return match ? Number(match[1].replace(',', '.')) : null
}

export function PlanDetail({
  plan,
  postcheck,
  precheckItems,
}: {
  plan: MissionPlanResponse | null
  postcheck?: PersistedPostDeviceCheckResponse | null
  precheckItems?: PreflightCheckItem[] | null
}) {
  if (!plan) {
    return <div className="odm-or-empty">Chưa có kế hoạch bay.</div>
  }
  const estimatedUsedPercent =
    plan.estimatedBatteryUsedPercent ??
    (plan.estimatedEnergyMah != null && plan.batteryCapacityMah
      ? (plan.estimatedEnergyMah / plan.batteryCapacityMah) * 100
      : null)
  const remainingBattery =
    plan.estimatedRemainingBatteryPercent ?? postcheck?.landingBatteryPercent ?? null
  return (
    <div className="odm-or-detail-grid">
      <MetricTile label="Thuật toán" value={plan.planningAlgorithm} />
      <MetricTile label="Quãng đường" value={formatNumber(plan.plannedDistanceM, ' m')} />
      <MetricTile label="Thời lượng" value={formatDuration(plan.plannedDurationSec)} />
      <MetricTile label="Năng lượng" value={formatNumber(plan.estimatedEnergyMah, ' mAh')} />
      <MetricTile label="Pin trước bay" value={formatNumber(plan.availableBatteryPercentAtPlanning ?? batteryFromPrecheck(precheckItems), '%')} />
      <MetricTile label="Pin dùng dự kiến" value={formatNumber(estimatedUsedPercent, '%')} />
      <MetricTile label="Pin còn lại" value={formatNumber(remainingBattery, '%')} />
      <MetricTile label="Độ cao tối đa" value={formatNumber(plan.maxPlannedAltitudeM, ' m')} />
      <MetricTile label="Waypoint" value={plan.waypoints?.length ?? 0} />
    </div>
  )
}

export function ResultDetail({
  result,
  media,
  locale,
  mediaLimit = 4,
}: {
  result: MissionResultResponse | null
  media: MediaResponse[]
  locale: 'vi-VN' | 'en-US'
  mediaLimit?: number
}) {
  const mediaCount = result?.mediaCount ?? result?.mediaFiles?.length ?? media.length
  return (
    <div className="odm-or-detail-stack">
      {result ? (
        <>
          <div className="odm-or-result-line">
            <span className={`odm-or-pill odm-or-pill-${checkTone(result.status)}`}>
              {checkLabel(result.status)}
            </span>
            <span className={`odm-or-pill odm-or-pill-${checkTone(result.approvalStatus)}`}>
              {checkLabel(result.approvalStatus)}
            </span>
          </div>
          <dl className="odm-or-kv compact">
            <div>
              <dt>Gửi lúc</dt>
              <dd>{result.approvalStatus === 'DRAFT' ? 'Chưa gửi' : formatDateTime(result.submittedAt, locale)}</dd>
            </div>
            <div>
              <dt>Thời lượng thực tế</dt>
              <dd>{formatDuration(result.durationSeconds)}</dd>
            </div>
            <div>
              <dt>Số media</dt>
              <dd>{mediaCount}</dd>
            </div>
          </dl>
          {result.summary || result.notes ? (
            <p className="odm-or-detail-note">{result.summary ?? result.notes}</p>
          ) : null}
        </>
      ) : (
        <div className="odm-or-empty">Chưa có mission result được gửi.</div>
      )}
      {media.length > 0 ? (
        <ul className="odm-or-media-list">
          {media.slice(0, mediaLimit).map((item) => (
            <li key={item.id}>
              <span className="odm-mono">{item.type}</span>
              <span>{formatNumber(item.fileSize / 1024 / 1024, ' MB')}</span>
              <time>{formatDateTime(item.capturedAt, locale)}</time>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
