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
import { OrderIcon } from './OrderIcon'
import { OrderLocationCard } from './OrderLocationCard'
import { resolveOrderGpsCenter } from './orderGps'
import { usePlanningConfirmation } from '../planning/usePlanningConfirmation'

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
  useEffect(() => {
    setReview(areaReviewFromOrder(order))
  }, [
    order.id,
    order.legalReviewStatus,
    order.requestedScopeFeasible,
    order.flightAreaReviewReason,
    order.flightAreaReviewNote,
    order.flightAreaReviewedByName,
    order.flightAreaReviewedAt,
    order.updatedAt,
  ])
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
            <span className="odm-or-card-title odm-or-area-title">
              <span className="odm-or-area-title-icon" aria-hidden="true">
                <OrderIcon name="chart" size={20} />
              </span>
              Kết quả kiểm tra khu vực
            </span>
            {order.status === 'PENDING' ? (
              <button
                type="button"
                className={`odm-or-area-refresh${assessment.loading ? ' is-loading' : ''}`}
                onClick={assessment.reload}
                disabled={assessment.loading}
                aria-label={assessment.loading ? 'Đang kiểm tra…' : 'Kiểm tra lại'}
                title={assessment.loading ? 'Đang kiểm tra…' : 'Kiểm tra lại'}
              >
                <OrderIcon name="refresh" size={18} />
              </button>
            ) : null}
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
                  <summary>
                    <OrderIcon name="doc" size={18} />
                    <span>Xem dữ liệu kiểm tra chi tiết</span>
                    <span className="odm-or-area-chevron" aria-hidden="true">
                      <OrderIcon name="chevron-right" size={18} />
                    </span>
                  </summary>
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
                ) : !hasMinistryViolations &&
                  data.assessment.level === 'FAVORABLE' ? (
                  <div className="odm-or-area-clear">
                    <span className="odm-or-area-clear-icon" aria-hidden="true">
                      <OrderIcon name="check" size={14} />
                    </span>
                    <div>
                      <strong>Kiểm tra sơ bộ chưa ghi nhận cảnh báo.</strong>
                      <small>
                        Manager vẫn cần xác nhận điều kiện thực tế trước khi duyệt.
                      </small>
                    </div>
                  </div>
                ) : null}
                {findings && findings.length > 0 || hasMinistryViolations ? (
                  <p className="odm-or-area-disclaimer">
                    {data.assessment.disclaimer}
                  </p>
                ) : null}
                <a
                  className="odm-or-area-source"
                  href={
                    data.ministryFlightBan?.sourceUrl ??
                    'https://cambay.mod.gov.vn/'
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  <OrderIcon name="plane" size={18} />
                  <span>Mở bản đồ cấm bay của Bộ Quốc phòng</span>
                  <OrderIcon name="chevron-right" size={18} />
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
  const reviewedAt = order.flightAreaReviewedAt
    ? new Date(order.flightAreaReviewedAt).getTime()
    : Number.NaN
  const updatedAt = order.updatedAt ? new Date(order.updatedAt).getTime() : Number.NaN
  // A customer location correction updates the order after the verdict was
  // recorded. That verdict belongs to the old coordinates and is only history.
  if (
    order.status === 'PENDING' &&
    Number.isFinite(reviewedAt) &&
    Number.isFinite(updatedAt) &&
    updatedAt - reviewedAt > 1_000
  ) {
    return null
  }
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
  const confirmation = usePlanningConfirmation()
  // Once the order is rejected/cancelled/sent back, the review is history: no more actions.
  const decided = order.status !== 'PENDING'
  return (
    <>
    <div className={`odm-or-area-manager-review${review ? ` is-${review.status.toLowerCase()}` : ''}`}>
      {review ? (
        <>
          <span className="odm-or-area-review-label">Đánh giá của Manager</span>
          <strong className={`odm-or-area-verdict is-${review.status.toLowerCase()}`}>
            <OrderIcon name={review.status === 'REJECTED' ? 'x' : review.status === 'PENDING_PERMIT' ? 'alert' : 'shield'} size={20} />
            {areaReviewLabel(review.status)}
          </strong>
          {review.reason ? <p className="odm-or-area-reason"><span>Lý do</span>{review.reason}</p> : null}
          {review.note ? <p className="odm-or-area-reason"><span>Ghi chú</span>{review.note}</p> : null}
          <small>
            {review.reviewer ?? 'Manager'}
            {review.reviewedAt
              ? ` · ${new Intl.DateTimeFormat('vi-VN', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }).format(new Date(review.reviewedAt))}`
              : ''}
          </small>
          {decided ? null : (
            <button type="button" className="odm-or-area-edit" onClick={onEdit}>
              <OrderIcon name="edit" size={18} />
              <span>Chỉnh sửa đánh giá</span>
              <OrderIcon name="chevron-right" size={18} />
            </button>
          )}
          {review.status === 'REJECTED' ? (
            <div className="odm-or-area-contact">
              <OrderIcon name="phone" size={20} />
              <div>
                <span>Liên hệ khách hàng</span>
                <strong>{order.customer.fullName}</strong>
                {order.customer.phone ? (
                  <a href={`tel:${order.customer.phone.replace(/\s+/g, '')}`}>{order.customer.phone}</a>
                ) : (
                  <em>Chưa có số điện thoại</em>
                )}
              </div>
            </div>
          ) : null}
          {review.status === 'REJECTED' && !decided ? (
            <div className="odm-or-area-secondary-actions">
              <button type="button" onClick={() => void resolveUnsuitable(order, review, 'NEED_INFO', confirmation.confirm)}>
                <OrderIcon name="swap" size={16} />
                Yêu cầu khách đổi khu vực
              </button>
              <button type="button" className="is-danger" onClick={() => void resolveUnsuitable(order, review, 'REJECTED', confirmation.confirm)}>
                <OrderIcon name="x" size={16} />
                Từ chối đơn hàng
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p>Chưa có đánh giá của Manager.</p>
          {decided ? null : (
            <button type="button" className="odm-btn odm-btn-p" onClick={onEdit}>
              Đánh giá khu vực
            </button>
          )}
          <a href="#portal/manager/support">Cần trợ giúp? Liên hệ hỗ trợ</a>
        </>
      )}
    </div>
    {confirmation.dialog}
    </>
  )
}

type AreaReviewChoice = LegalReviewStatus | 'CHANGE_LOCATION'

const REVIEW_OPTIONS: Array<{
  status: AreaReviewChoice
  label: string
  hint: string
}> = [
  { status: 'NOT_REQUIRED', label: 'Khu vực phù hợp sơ bộ', hint: 'Có thể tiếp tục duyệt đơn và phân nguồn lực. Hồ sơ xin phép bay được thực hiện ở bước sau.' },
  { status: 'CHANGE_LOCATION', label: 'Yêu cầu khách đổi khu vực', hint: 'Trả đơn về cho khách chọn lại vị trí giám sát.' },
  { status: 'REJECTED', label: 'Khu vực không khả thi', hint: 'Khu vực hiện tại không thể triển khai theo yêu cầu.' },
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
  const [status, setStatus] = useState<AreaReviewChoice | null>(initial?.status ?? null)
  const [reason, setReason] = useState(initial?.reason ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const reasonRequired = status === 'REJECTED' || status === 'CHANGE_LOCATION'

  async function save() {
    if (!status) return setError('Chọn một kết quả đánh giá.')
    if (reasonRequired && !reason.trim()) return setError('Chọn lý do khu vực không phù hợp.')
    setSaving(true)
    setError('')
    try {
      const savedStatus: LegalReviewStatus = status === 'CHANGE_LOCATION' ? 'REJECTED' : status
      const result = await ordersApi.saveFlightAreaReview(order.id, {
        status: savedStatus,
        reason: reason.trim() || null,
        note: note.trim() || null,
      })
      if (status === 'CHANGE_LOCATION') {
        await ordersApi.submitApproval(order.id, {
          decision: 'NEED_INFO',
          reason: [reason.trim(), note.trim()].filter(Boolean).join(' — '),
          requestedUpdateScope: 'LOCATION',
        })
        window.location.hash = managerHref({ screen: 'orderQueue' })
        return
      }
      onSaved({
        status: result.legalReviewStatus ?? savedStatus,
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
            placeholder="Ghi lại nội dung đã đối chiếu hoặc lưu ý cho bước tiếp theo…" />
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
    NOT_REQUIRED: 'Khu vực phù hợp sơ bộ',
    PENDING_PERMIT: 'Chờ xử lý giấy phép',
    APPROVED: 'Khu vực đã được xác nhận',
    REJECTED: 'Khu vực không khả thi',
  }
  return labels[status]
}

async function resolveUnsuitable(
  order: OrderDetail,
  review: SavedAreaReview,
  decision: 'NEED_INFO' | 'REJECTED',
  confirm: (question: { title: string; body: string; action?: string }) => Promise<boolean>,
) {
  const needInfo = decision === 'NEED_INFO'
  const accepted = await confirm({
    title: needInfo ? 'Yêu cầu khách đổi khu vực?' : 'Từ chối đơn hàng?',
    body: needInfo
      ? 'Đơn sẽ được chuyển về cho khách để chọn lại khu vực giám sát. Bạn nên gọi báo trước cho khách.'
      : 'Đơn sẽ bị từ chối và đóng lại. Bạn nên gọi báo cho khách trước khi từ chối.',
    action: needInfo ? 'Yêu cầu đổi khu vực' : 'Từ chối đơn',
  })
  if (!accepted) return
  const reason = [review.reason, review.note].filter(Boolean).join(' — ')
  await ordersApi.submitApproval(order.id, {
    decision,
    reason,
    ...(needInfo ? { requestedUpdateScope: 'LOCATION' as const } : {}),
  })
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
      <span className="odm-or-area-decision-icon" aria-hidden="true">
        <OrderIcon name={level === 'HIGH_RISK' ? 'x' : level === 'NEEDS_REVIEW' ? 'alert' : 'check'} size={20} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{guidance}</p>
      </div>
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
