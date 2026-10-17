import { useCallback, useEffect, useRef, useState } from 'react'

import {
  customerApi,
  type FlightAreaAssessment,
} from '../../../customer/api/customerApi'
import type { OrderReviewMessages } from '../../pages/OrderReviewPage.messages'
import { ordersApi } from '../../api/ordersApi'
import { managerHref } from '../../routes'
import type {
  LegalReviewStatus,
  OrderDetail,
} from '../../types/orders'
import { OrderLocationCard } from './OrderLocationCard'
import { resolveOrderGpsCenter } from './orderGps'

const assessmentCache = new Map<string, FlightAreaAssessment>()

export function OrderAreaCheck({
  order,
  t,
  onReviewSaved,
}: {
  order: OrderDetail
  t: OrderReviewMessages
  onReviewSaved?: (status: LegalReviewStatus) => void
}) {
  const [review, setReview] = useState(() => areaReviewFromOrder(order))
  const [reviewOpen, setReviewOpen] = useState(false)
  const resolved = resolveOrderGpsCenter(order.center)
  const latitude = resolved?.center.lat
  const longitude = resolved?.center.lon
  const radiusM = order.radiusM ?? 0
  const altitudeM = order.altitudeM ?? undefined
  const assessment = useCachedAreaAssessment({
    latitude,
    longitude,
    radiusM,
    altitudeM,
  })

  const data = assessment.data
  const findings = data?.assessment.findings.filter(
    (item) =>
      !item.code.includes('UNAVAILABLE') &&
      item.code !== 'RESTRICTED_ZONE_DATA_MISSING',
  )
  const ministryViolatedZones = data?.ministryFlightBan?.available
    ? data.ministryFlightBan.violatedZones
    : []
  const hasMinistryViolations = ministryViolatedZones.length > 0

  return (
    <section className="odm-or-area-check" aria-label="Kiểm tra vùng giám sát">
      <div className="odm-or-area-check-head">
        <div>
          <h2>Kiểm tra vùng giám sát</h2>
          <p>
            Giúp xác định khu vực có cần kiểm tra thêm trước khi duyệt đơn hay
            không. Kết quả này chỉ là cảnh báo sơ bộ, không tự động từ chối đơn.
          </p>
        </div>
        {data ? (
          <span
            className={`odm-or-area-risk is-${data.assessment.level.toLowerCase()}`}
          >
            {riskLabel(data.assessment.level)}
          </span>
        ) : null}
      </div>

      <div className="odm-or-area-check-grid">
        <OrderLocationCard order={order} t={t} showAreaAddress />
        <section className="odm-or-card">
          <header className="odm-or-card-head">
            <span className="odm-or-card-title">Kết quả kiểm tra khu vực</span>
            <button
              type="button"
              className="odm-or-btn-outline"
              onClick={assessment.reload}
              disabled={assessment.loading}
            >
              {assessment.loading ? 'Đang kiểm tra…' : 'Kiểm tra lại'}
            </button>
          </header>
          <div className="odm-or-card-body odm-or-area-results">
            {!resolved || radiusM <= 0 ? (
              <p className="odm-or-empty">
                Đơn chưa có đủ tọa độ hoặc bán kính để kiểm tra vùng.
              </p>
            ) : assessment.error ? (
              <p className="odm-or-area-error" role="alert">
                Không tải được kết quả kiểm tra vùng. Vui lòng thử lại.
              </p>
            ) : assessment.loading && !data ? (
              <p className="odm-or-empty">Đang phân tích vùng giám sát…</p>
            ) : data ? (
              <>
                <AreaDecisionSummary data={data} />
                <details className="odm-or-area-details">
                  <summary>Xem dữ liệu kiểm tra chi tiết</summary>
                  <dl className="odm-or-area-facts">
                    <Fact
                      label="Đối chiếu bản đồ Bộ Quốc phòng"
                      value={ministryLabel(data.ministryFlightBan)}
                    />
                    <Fact
                      label="Dữ liệu vùng cấm nội bộ"
                      value={restrictedLabel(data.restrictedZones)}
                    />
                    <Fact
                      label="Khoảng cách tới vùng cấm gần nhất"
                      value={distanceLabel(
                        data.restrictedZones
                          .nearestRestrictedZoneDistanceMeters,
                      )}
                    />
                    <Fact
                      label="Độ cao mặt đất tại vị trí"
                      value={metersLabel(data.elevation.terrainElevationMeters)}
                    />
                    <Fact
                      label="Công trình trong khu vực"
                      value={String(data.osmContext.buildingCount ?? 0)}
                    />
                    <Fact
                      label="Có sân bay gần khu vực"
                      value={data.osmContext.aerodromeNearby ? 'Có' : 'Không'}
                    />
                    <Fact
                      label="Có bãi đáp trực thăng gần khu vực"
                      value={data.osmContext.helipadNearby ? 'Có' : 'Không'}
                    />
                  </dl>
                </details>
                {hasMinistryViolations ? (
                  <div className="odm-or-area-findings">
                    <strong>Vùng cần đối chiếu</strong>
                    <ul>
                      {ministryViolatedZones.map((zone) => (
                        <li key={zone} className="is-high odm-or-area-zone-row">
                          <code>{zone}</code>
                          <button
                            type="button"
                            className="odm-or-area-zone-link"
                            title={`Mở cambay.mod.gov.vn và sao chép mã ${zone}`}
                            onClick={() => openMinistryMap(zone)}
                          >
                            Xem trên bản đồ
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {findings && findings.length > 0 ? (
                  <div className="odm-or-area-findings">
                    <strong>Cảnh báo cần xem xét</strong>
                    <ul>
                      {findings.map((finding) => (
                        <li
                          key={finding.code}
                          className={`is-${finding.severity.toLowerCase()}`}
                        >
                          {finding.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : !hasMinistryViolations ? (
                  <p className="odm-or-area-clear">
                    Không ghi nhận cảnh báo vùng cần chú ý.
                  </p>
                ) : null}
                <p className="odm-or-area-disclaimer">
                  {data.assessment.disclaimer}
                </p>
                <a
                  className="odm-or-area-source"
                  href={
                    data.ministryFlightBan?.sourceUrl ??
                    'https://cambay.mod.gov.vn/'
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở bản đồ cấm bay của Bộ Quốc phòng
                </a>
                <ManagerAreaReview
                  order={order}
                  review={review}
                  onEdit={() => setReviewOpen(true)}
                />
              </>
            ) : null}
          </div>
        </section>
      </div>
      {reviewOpen ? (
        <AreaReviewDialog
          order={order}
          initial={review}
          zoneCount={ministryViolatedZones.length}
          onClose={() => setReviewOpen(false)}
          onSaved={(next) => {
            setReview(next)
            setReviewOpen(false)
            onReviewSaved?.(next.status)
          }}
        />
      ) : null}
    </section>
  )
}

type SavedAreaReview = {
  status: LegalReviewStatus
  requestedScopeFeasible: boolean | null
  reason: string | null
  note: string | null
  reviewer: string | null
  reviewedAt: string | null
}

function areaReviewFromOrder(order: OrderDetail): SavedAreaReview | null {
  if (!order.legalReviewStatus || order.legalReviewStatus === 'NOT_REVIEWED') return null
  return {
    status: order.legalReviewStatus,
    requestedScopeFeasible: order.requestedScopeFeasible ?? null,
    reason: order.flightAreaReviewReason ?? null,
    note: order.flightAreaReviewNote ?? null,
    reviewer: order.flightAreaReviewedByName ?? null,
    reviewedAt: order.flightAreaReviewedAt ?? null,
  }
}

function ManagerAreaReview({
  order,
  review,
  onEdit,
}: {
  order: OrderDetail
  review: SavedAreaReview | null
  onEdit: () => void
}) {
  const [resolutionStatus, setResolutionStatus] = useState<'APPROVED' | 'REJECTED' | null>(null)
  return (
    <>
    <div className="odm-or-area-manager-review">
      {review ? (
        <>
          <span>Đánh giá của Manager</span>
          <strong className={`is-${review.status.toLowerCase()}`}>
            {areaReviewLabel(review.status)}
          </strong>
          {review.reason ? <p><b>Lý do:</b> {review.reason}</p> : null}
          {review.note ? <p><b>Ghi chú:</b> {review.note}</p> : null}
          <small>
            {review.reviewer ?? 'Manager'}
            {review.reviewedAt
              ? ` · ${new Intl.DateTimeFormat('vi-VN', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }).format(new Date(review.reviewedAt))}`
              : ''}
          </small>
          <button type="button" className="odm-or-btn-outline" onClick={onEdit}>
            Chỉnh sửa đánh giá
          </button>
          {review.status === 'PENDING_PERMIT' ? (
            <div className="odm-or-area-secondary-actions">
              <button type="button" onClick={() => setResolutionStatus('APPROVED')}>
                Đã có giấy phép
              </button>
              <button type="button" className="is-danger" onClick={() => setResolutionStatus('REJECTED')}>
                Không được cấp phép
              </button>
            </div>
          ) : null}
          {review.status === 'REJECTED' ? (
            <div className="odm-or-area-secondary-actions">
              <button type="button" onClick={() => void resolveUnsuitable(order, review, 'NEED_INFO')}>
                Yêu cầu khách đổi khu vực
              </button>
              <button type="button" className="is-danger" onClick={() => void resolveUnsuitable(order, review, 'REJECTED')}>
                Từ chối đơn hàng
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p>Chưa có đánh giá của Manager.</p>
          <button type="button" className="odm-btn odm-btn-p" onClick={onEdit}>
            Đánh giá khu vực
          </button>
          <a href="#portal/manager/support">Cần trợ giúp? Liên hệ hỗ trợ</a>
        </>
      )}
    </div>
    {resolutionStatus ? (
      <PermitResolutionDialog
        order={order}
        status={resolutionStatus}
        onClose={() => setResolutionStatus(null)}
      />
    ) : null}
    </>
  )
}

const REVIEW_OPTIONS: Array<{
  status: LegalReviewStatus
  label: string
  hint: string
}> = [
  { status: 'NOT_REQUIRED', label: 'Đạt sơ bộ', hint: 'Không cần xác minh giấy phép thêm.' },
  { status: 'PENDING_PERMIT', label: 'Cần xác minh giấy phép', hint: 'Tạm dừng thanh toán trong khi Manager xử lý bên ngoài hệ thống.' },
  { status: 'REJECTED', label: 'Không phù hợp', hint: 'Khu vực hiện tại không thể thực hiện theo yêu cầu.' },
]

const UNSUITABLE_REASONS = [
  'Khu vực cấm/hạn chế không đáp ứng điều kiện',
  'Không thể bảo đảm phạm vi hoạt động',
  'Không thể xác minh điều kiện khu vực',
  'Lý do khác',
]

function AreaReviewDialog({ order, initial, zoneCount, onClose, onSaved }: {
  order: OrderDetail
  initial: SavedAreaReview | null
  zoneCount: number
  onClose: () => void
  onSaved: (review: SavedAreaReview) => void
}) {
  const [status, setStatus] = useState<LegalReviewStatus | null>(initial?.status ?? null)
  const [reason, setReason] = useState(initial?.reason ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const reasonRequired = status === 'REJECTED'

  async function save() {
    if (!status) return setError('Chọn một kết quả đánh giá.')
    if (reasonRequired && !reason.trim()) return setError('Chọn lý do khu vực không phù hợp.')
    setSaving(true)
    setError('')
    try {
      const result = await ordersApi.saveFlightAreaReview(order.id, {
        status,
        reason: reason.trim() || null,
        note: note.trim() || null,
      })
      onSaved({
        status: result.legalReviewStatus ?? status,
        requestedScopeFeasible: result.requestedScopeFeasible ?? null,
        reason: result.flightAreaReviewReason ?? (reason.trim() || null),
        note: result.flightAreaReviewNote ?? (note.trim() || null),
        reviewer: result.flightAreaReviewedByName ?? 'Manager',
        reviewedAt: result.flightAreaReviewedAt ?? new Date().toISOString(),
      })
    } catch {
      setError('Không thể lưu đánh giá. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="odm-or-area-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="odm-or-area-modal" role="dialog" aria-modal="true" aria-labelledby="area-review-title">
        <header>
          <div>
            <h3 id="area-review-title">Đánh giá điều kiện khu vực bay</h3>
            <p>Kết quả bản đồ cần được Manager xác nhận trước khi tiếp tục.</p>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose}>×</button>
        </header>
        <div className="odm-or-area-modal-context">
          <b>{order.title || 'Yêu cầu giám sát'}</b><span>{zoneCount} vùng cần đối chiếu</span>
        </div>
        <div className="odm-or-area-review-options">
          {REVIEW_OPTIONS.map((option) => (
            <label key={option.status} className={status === option.status ? 'is-selected' : ''}>
              <input type="radio" name="area-review" checked={status === option.status}
                onChange={() => { setStatus(option.status); setError('') }} />
              <span><b>{option.label}</b><small>{option.hint}</small></span>
            </label>
          ))}
        </div>
        {status === 'PENDING_PERMIT' ? (
          <p className="odm-or-area-permission-note">
            Cần xác minh giấy phép trước khi đơn hàng được duyệt thực hiện. Khách hàng chưa thể thanh toán cho đến khi Manager cập nhật kết quả xác minh.
          </p>
        ) : null}
        {reasonRequired ? (
          <label className="odm-or-area-field">Lý do
            <select value={reason} onChange={(event) => setReason(event.target.value)}>
              <option value="">Chọn lý do</option>
              {UNSUITABLE_REASONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        ) : null}
        <label className="odm-or-area-field">Ghi chú của Manager
          <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)}
            placeholder="Ghi lại nội dung đã đối chiếu hoặc thông tin cần xác minh…" />
        </label>
        {error ? <p className="odm-or-area-error" role="alert">{error}</p> : null}
        <footer>
          <button type="button" className="odm-btn" onClick={onClose}>Hủy</button>
          <button type="button" className="odm-btn odm-btn-p" disabled={saving} onClick={save}>
            {saving ? 'Đang lưu…' : 'Xác nhận đánh giá'}
          </button>
        </footer>
      </section>
    </div>
  )
}

function areaReviewLabel(status: LegalReviewStatus) {
  const labels: Record<LegalReviewStatus, string> = {
    NOT_REVIEWED: 'Chưa đánh giá',
    NOT_REQUIRED: 'Đạt sơ bộ',
    PENDING_PERMIT: 'Đang xác minh giấy phép',
    APPROVED: 'Đã có giấy phép',
    REJECTED: 'Không được cấp phép',
  }
  return labels[status]
}

function PermitResolutionDialog({ order, status, onClose }: {
  order: OrderDetail
  status: 'APPROVED' | 'REJECTED'
  onClose: () => void
}) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const approved = status === 'APPROVED'

  async function confirm() {
    setSaving(true)
    setError('')
    try {
      await ordersApi.resolveLegalReview(order.id, status, note.trim() || undefined)
      window.location.reload()
    } catch {
      setError('Không thể cập nhật kết quả xác minh. Vui lòng thử lại.')
      setSaving(false)
    }
  }

  return (
    <div className="odm-or-area-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (!saving && event.target === event.currentTarget) onClose()
    }}>
      <section className="odm-or-area-modal" role="dialog" aria-modal="true" aria-labelledby="permit-resolution-title">
        <header>
          <div>
            <h3 id="permit-resolution-title">
              {approved ? 'Xác nhận đã có giấy phép' : 'Xác nhận không được cấp phép'}
            </h3>
            <p>
              {approved
                ? 'Đơn hàng sẽ đủ điều kiện để tiếp tục duyệt và thanh toán.'
                : 'Đơn hàng sẽ bị chặn duyệt và thanh toán.'}
            </p>
          </div>
          <button type="button" aria-label="Đóng" disabled={saving} onClick={onClose}>×</button>
        </header>
        <div className="odm-or-area-modal-context">
          <b>{order.title || 'Yêu cầu giám sát'}</b>
          <span>{order.code}</span>
        </div>
        <label className="odm-or-area-field">
          Ghi chú <small>(không bắt buộc)</small>
          <textarea
            rows={4}
            value={note}
            maxLength={1000}
            autoFocus
            placeholder={approved ? 'Nhập thông tin giấy phép hoặc nội dung đã xác minh…' : 'Nhập lý do hoặc kết quả xác minh…'}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <div className="odm-or-area-char-count">{note.length}/1000</div>
        {error ? <p className="odm-or-area-error" role="alert">{error}</p> : null}
        <footer>
          <button type="button" className="odm-btn" disabled={saving} onClick={onClose}>Hủy</button>
          <button
            type="button"
            className={`odm-btn ${approved ? 'odm-btn-p' : 'is-danger'}`}
            disabled={saving}
            onClick={() => void confirm()}
          >
            {saving ? 'Đang cập nhật…' : 'Xác nhận'}
          </button>
        </footer>
      </section>
    </div>
  )
}

async function resolveUnsuitable(
  order: OrderDetail,
  review: SavedAreaReview,
  decision: 'NEED_INFO' | 'REJECTED',
) {
  const action = decision === 'NEED_INFO' ? 'yêu cầu khách đổi khu vực' : 'từ chối đơn hàng'
  if (!window.confirm(`Xác nhận ${action}?`)) return
  const reason = [review.reason, review.note].filter(Boolean).join(' — ')
  await ordersApi.submitApproval(order.id, { decision, reason })
  window.location.hash = managerHref({ screen: 'orderQueue' })
}

function useCachedAreaAssessment({
  latitude,
  longitude,
  radiusM,
  altitudeM,
}: {
  latitude?: number
  longitude?: number
  radiusM: number
  altitudeM?: number
}) {
  const cacheKey =
    latitude == null || longitude == null || radiusM <= 0
      ? null
      : `${latitude}:${longitude}:${radiusM}:${altitudeM ?? ''}`
  const cached = cacheKey ? assessmentCache.get(cacheKey) : undefined
  const [data, setData] = useState<FlightAreaAssessment | null | undefined>(
    cached,
  )
  const [error, setError] = useState<unknown>()
  const [loading, setLoading] = useState(Boolean(cacheKey && !cached))
  const [reloadToken, setReloadToken] = useState(0)
  const requestId = useRef(0)
  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    if (!cacheKey || latitude == null || longitude == null || radiusM <= 0) {
      setData(null)
      setError(undefined)
      setLoading(false)
      return
    }

    const saved = assessmentCache.get(cacheKey)
    if (saved && reloadToken === 0) {
      setData(saved)
      setError(undefined)
      setLoading(false)
      return
    }

    const id = ++requestId.current
    const controller = new AbortController()
    setLoading(true)
    setError(undefined)
    customerApi
      .getFlightAreaAssessment(
        {
          latitude,
          longitude,
          radiusMeters: radiusM,
          requestedAltitudeAgl: altitudeM,
          includeOsm: false,
        },
        controller.signal,
      )
      .then((result) => {
        if (requestId.current !== id) return
        assessmentCache.set(cacheKey, result)
        setData(result)
      })
      .catch((reason: unknown) => {
        if (requestId.current !== id) return
        if (reason instanceof DOMException && reason.name === 'AbortError')
          return
        setError(reason)
      })
      .finally(() => {
        if (requestId.current === id) setLoading(false)
      })

    return () => controller.abort()
  }, [cacheKey, latitude, longitude, radiusM, altitudeM, reloadToken])

  return { data, error, loading, reload }
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function AreaDecisionSummary({ data }: { data: FlightAreaAssessment }) {
  const level = data.assessment.level
  const hasMinistryConflict =
    Boolean(data.ministryFlightBan?.violatedZones.length) ||
    (data.ministryFlightBan?.violatedAreaSquareMeters ?? 0) > 0
  const title =
    level === 'HIGH_RISK'
      ? 'Chưa nên duyệt khu vực này'
      : level === 'NEEDS_REVIEW'
        ? 'Cần kiểm tra thêm trước khi duyệt'
        : 'Chưa phát hiện trở ngại đáng kể'
  const guidance = hasMinistryConflict
    ? 'Bản đồ của Bộ Quốc phòng ghi nhận khu vực giao vùng cấm hoặc hạn chế bay. Hãy mở bản đồ, đối chiếu mã vùng bên dưới và xác nhận điều kiện trước khi duyệt.'
    : level === 'HIGH_RISK' || level === 'NEEDS_REVIEW'
      ? 'Hãy xem các cảnh báo bên dưới và xác nhận điều kiện thực tế trước khi duyệt.'
      : 'Bạn có thể tiếp tục xem các điều kiện duyệt khác. Điều kiện bay cuối cùng vẫn cần được xác nhận khi lập kế hoạch.'

  return (
    <div className={`odm-or-area-decision is-${level.toLowerCase()}`}>
      <strong>{title}</strong>
      <p>{guidance}</p>
    </div>
  )
}

function openMinistryMap(zoneCode: string) {
  window.open('https://cambay.mod.gov.vn/', '_blank', 'noopener,noreferrer')
  void navigator.clipboard?.writeText(zoneCode).catch(() => undefined)
}

function riskLabel(level: string) {
  if (level === 'HIGH_RISK') return 'Rủi ro cao'
  if (level === 'NEEDS_REVIEW') return 'Cần xem xét'
  return 'Thuận lợi'
}

function restrictedLabel(value: {
  dataAvailable: boolean
  pointInsideRestrictedZone: boolean
  monitoringAreaIntersectsRestrictedZone: boolean
}) {
  if (!value.dataAvailable) return 'Chưa có dữ liệu'
  if (value.pointInsideRestrictedZone) return 'Tâm vùng nằm trong vùng cấm'
  if (value.monitoringAreaIntersectsRestrictedZone)
    return 'Vùng giám sát giao vùng cấm'
  return 'Không giao vùng cấm'
}

function distanceLabel(value: number | null | undefined) {
  return value == null
    ? 'Chưa xác định'
    : `${Math.round(value).toLocaleString('vi-VN')} m`
}

function metersLabel(value: number | null | undefined) {
  return value == null ? 'Chưa xác định' : `${Math.round(value)} m AMSL`
}

function ministryLabel(
  value:
    | {
        available: boolean
        violatedAreaSquareMeters?: number | null
        violatedZones: string[]
      }
    | undefined,
) {
  if (!value?.available) return 'Không kết nối được'
  if (
    (value.violatedAreaSquareMeters ?? 0) > 0 ||
    value.violatedZones.length > 0
  ) {
    return 'Có giao vùng cấm/hạn chế bay'
  }
  return 'Không ghi nhận giao vùng cấm'
}
