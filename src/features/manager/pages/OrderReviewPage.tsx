import { useEffect, useRef, useState } from 'react'

import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  aiVerdictLabel,
  aiVerdictTone,
  findingSeverityTone,
} from '../../../shared/lib/statusTone'
import { ordersApi } from '../api/ordersApi'
import { managerHref } from '../routes'
import type {
  ApprovalDecision,
  FindingCustomerAction,
  OrderAnalysis,
  OrderDetail,
  OrderResourcePreview,
} from '../types/orders'
import '../manager.css'

const customerActionLabel: Record<
  Exclude<FindingCustomerAction, null>,
  string
> = {
  ACCEPTED: 'ACCEPTED',
  IGNORED: 'IGNORED',
  AUTO_FIXED: 'AUTO_FIXED',
}

const rejectReasonChips = [
  'Vùng cấm bay',
  'Thiếu nguồn lực',
  'Thông tin chưa rõ ràng',
  'Ngoài phạm vi dịch vụ',
]

const infoReasonChips = [
  'Cần mặt bằng chi tiết',
  'Cần xác nhận quyền sử dụng đất',
  'Cần rõ khung giờ',
]

type ModalKind = 'reject' | 'info' | null

export function OrderReviewPage({ orderId }: { orderId: string }) {
  const orderQuery = useApiQuery(
    (signal) => ordersApi.getOrder(orderId, signal),
    [orderId],
  )
  const analysisQuery = useApiQuery(
    (signal) => ordersApi.getLatestAnalysis(orderId, signal),
    [orderId],
  )
  const previewQuery = useApiQuery(
    (signal) => ordersApi.getResourcePreview(orderId, signal),
    [orderId],
  )

  const [modal, setModal] = useState<ModalKind>(null)
  const [navigateHome, setNavigateHome] = useState(false)

  if (navigateHome) {
    window.location.hash = managerHref({ screen: 'orderQueue' })
    return null
  }

  if (orderQuery.loading) return <ReviewSkeleton orderId={orderId} />

  if (orderQuery.error) {
    const is409 =
      orderQuery.error instanceof ApiError && orderQuery.error.status === 409
    return (
      <div className="odm-mgr-dash">
        <ReviewBreadcrumbHeader orderId={orderId} />
        <div className="odm-card">
          <div className="odm-mgr-review-error">
            <div className="odm-mgr-review-error-icon" aria-hidden="true">
              !
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              Không tải được hồ sơ đơn
            </div>
            <div
              style={{ color: 'var(--tx3)', maxWidth: 420, lineHeight: 1.5 }}
            >
              {is409
                ? 'Đơn không còn ở trạng thái chờ duyệt (đã được xử lý bởi đồng nghiệp) hoặc máy chủ lỗi.'
                : 'Đã có lỗi khi kết nối tới máy chủ. Kiểm tra mạng rồi thử lại.'}
            </div>
            <div
              className="odm-mono"
              style={{
                fontSize: 11.5,
                color: 'var(--tx3)',
                background: 'var(--sf3)',
                padding: '3px 8px',
                borderRadius: 5,
              }}
            >
              {orderQuery.error instanceof ApiError
                ? `${orderQuery.error.method} ${orderQuery.error.path}${
                    orderQuery.error.status
                      ? ` · ${orderQuery.error.status}`
                      : ''
                  }${orderQuery.error.code ? ` ${orderQuery.error.code}` : ''}`
                : 'GET /orders/{id}'}
            </div>
            <a
              className="odm-btn odm-btn-p"
              href={managerHref({ screen: 'orderQueue' })}
            >
              Về hàng đợi
            </a>
          </div>
        </div>
      </div>
    )
  }

  const order = orderQuery.data
  if (!order) return null

  return (
    <div className="odm-mgr-dash">
      <ReviewBreadcrumbHeader orderId={order.code} />
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">Duyệt đơn {order.code}</h1>
          <div className="odm-mgr-dash-date">
            {order.serviceName} · gửi {formatVn(order.submittedAt)}
          </div>
        </div>
        <StatusBadge tone="yellow" size="lg">
          Đang duyệt
        </StatusBadge>
      </div>

      <div className="odm-mgr-review-grid">
        <div className="odm-mgr-review-col">
          <CustomerCard order={order} />
          <LocationCard order={order} />
          <ServiceCard order={order} />
          <AttachmentsCard order={order} />
        </div>
        <div className="odm-mgr-review-col">
          <AnalysisCard query={analysisQuery} />
          <ResourcePreviewCard query={previewQuery} />
          <InternalNoteCard orderId={order.id} />
        </div>
      </div>

      <div className="odm-mgr-review-actionbar">
        <span className="odm-mgr-review-actionbar-hint">
          Quyết định sẽ ghi vào order_approval, order_status_history và gửi
          thông báo cho khách.
        </span>
        <button
          type="button"
          className="odm-btn odm-btn-yl odm-btn-lg"
          onClick={() => setModal('info')}
        >
          Yêu cầu bổ sung
        </button>
        <button
          type="button"
          className="odm-btn odm-btn-rd odm-btn-lg"
          onClick={() => setModal('reject')}
        >
          Từ chối
        </button>
        <ApproveButton orderId={order.id} />
      </div>

      {modal ? (
        <DecisionModal
          kind={modal}
          orderCode={order.code}
          orderId={order.id}
          onClose={() => setModal(null)}
          onDone={() => setNavigateHome(true)}
        />
      ) : null}
    </div>
  )
}

function formatVn(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

function ReviewBreadcrumbHeader({ orderId }: { orderId: string }) {
  return (
    <div className="odm-mgr-review-breadcrumb">
      <a href={managerHref({ screen: 'orderQueue' })}>Duyệt đơn</a>
      <span aria-hidden="true">/</span>
      <span>{orderId}</span>
    </div>
  )
}

function CustomerCard({ order }: { order: OrderDetail }) {
  const initials = order.customer.fullName
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <div className="odm-card">
      <div className="odm-card-header">Khách hàng</div>
      <div className="odm-card-body odm-mgr-review-customer">
        <span className="odm-mgr-review-avatar" aria-hidden="true">
          {initials}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {order.customer.fullName}
          </div>
          <div style={{ color: 'var(--tx3)' }}>
            {order.customer.companyName}
          </div>
        </div>
        <div
          style={{ textAlign: 'right', color: 'var(--tx2)', fontSize: 12.5 }}
        >
          <div>{order.customer.email}</div>
          <div>{order.customer.phone}</div>
        </div>
      </div>
    </div>
  )
}

function LocationCard({ order }: { order: OrderDetail }) {
  return (
    <div className="odm-card">
      <div className="odm-card-header">Vị trí và vùng giám sát</div>
      <div className="odm-mgr-review-map">
        <svg
          viewBox="0 0 520 220"
          role="img"
          aria-label="Bản đồ khu vực giám sát"
        >
          <rect width="520" height="220" className="odm-mgr-map-bg" />
          <circle cx="260" cy="110" r="80" className="odm-mgr-map-radius" />
          <g transform="translate(260,110)">
            <path
              d="M0 0 C-10 -12 -13 -18 -13 -23 a13 13 0 0126 0 C13 -18 10 -12 0 0z"
              className="odm-mgr-map-pin"
            />
            <circle cy="-23" r="4.5" className="odm-mgr-map-pin-dot" />
          </g>
          <text
            x="260"
            y="200"
            textAnchor="middle"
            className="odm-mgr-map-label"
          >
            Bán kính giám sát: {order.radiusM} m
          </text>
        </svg>
      </div>
      <div className="odm-card-body odm-mgr-review-location-grid">
        <div>
          <div className="odm-mgr-review-hint">address_text</div>
          <div style={{ fontWeight: 600 }}>{order.addressText}</div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">center</div>
          <div className="odm-mono" style={{ fontWeight: 600 }}>
            {order.center.lat}, {order.center.lon}
          </div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">radius_m</div>
          <div className="odm-tn" style={{ fontWeight: 600 }}>
            {order.radiusM} m
          </div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">Trạm gần nhất</div>
          <div style={{ fontWeight: 600 }}>{order.nearestBase}</div>
        </div>
      </div>
    </div>
  )
}

function ServiceCard({ order }: { order: OrderDetail }) {
  return (
    <div className="odm-card">
      <div className="odm-card-header">Dịch vụ và yêu cầu media</div>
      <div className="odm-card-body">
        <dl className="odm-mgr-review-kv">
          <div>
            <dt>Dịch vụ</dt>
            <dd>{order.serviceName}</dd>
          </div>
          <div>
            <dt>Thời gian mong muốn</dt>
            <dd>{order.preferredWindow}</dd>
          </div>
          {order.mediaRequirements.map((req, i) => (
            <div key={i}>
              <dt>Media {i + 1}</dt>
              <dd>{req.label}</dd>
            </div>
          ))}
          <div>
            <dt>Mục đích</dt>
            <dd>{order.purpose}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function AttachmentsCard({ order }: { order: OrderDetail }) {
  if (order.attachments.length === 0) return null
  return (
    <div className="odm-card">
      <div className="odm-card-header">Tệp đính kèm</div>
      <div
        className="odm-card-body"
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {order.attachments.map((att) => (
          <div key={att.url} className="odm-mgr-review-attachment">
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{att.name}</div>
              <div className="odm-mgr-review-hint">
                {att.sizeLabel} · {att.mimeType}
              </div>
            </div>
            <a className="odm-btn odm-btn-sm" href={att.url}>
              Tải
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalysisCard({
  query,
}: {
  query: ReturnType<typeof useApiQuery<OrderAnalysis>>
}) {
  if (query.loading) {
    return (
      <div className="odm-card">
        <div className="odm-card-body">
          <span
            className="odm-sk"
            style={{ width: '100%', height: 140, display: 'block' }}
          />
        </div>
      </div>
    )
  }
  if (query.error || !query.data) {
    return (
      <div className="odm-card">
        <div className="odm-card-body">Không tải được phân tích AI.</div>
      </div>
    )
  }
  const analysis = query.data
  const tone = aiVerdictTone[analysis.overallVerdict]
  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span>Phân tích AI</span>
        {analysis.ruleEngineMs ? (
          <span
            style={{ fontWeight: 500, color: 'var(--tx3)', fontSize: 11.5 }}
          >
            rule {analysis.ruleEngineMs} ms
          </span>
        ) : null}
      </div>
      <div className="odm-card-body">
        <div className={`odm-mgr-verdict-banner odm-mgr-verdict-${tone}`}>
          <span className="odm-mgr-verdict-icon" aria-hidden="true">
            {analysis.overallVerdict === 'FEASIBLE' ? '✓' : '!'}
          </span>
          <div style={{ flex: 1 }}>
            <div className="odm-mgr-verdict-title">
              {aiVerdictLabel[analysis.overallVerdict].toUpperCase()}{' '}
              <span className="odm-mono odm-mgr-verdict-code">
                {analysis.overallVerdict}
              </span>
            </div>
            {analysis.llmSummary ? (
              <div className="odm-mgr-verdict-summary">
                {analysis.llmSummary}
              </div>
            ) : null}
          </div>
          <div className="odm-mgr-verdict-counts">
            <span>{analysis.blockerCount} BLOCKER</span>
            <span>{analysis.warningCount} WARNING</span>
          </div>
        </div>

        {analysis.findings.length === 0 ? (
          <div className="odm-mgr-review-hint" style={{ marginTop: 10 }}>
            Không có finding nào.
          </div>
        ) : (
          analysis.findings.map((finding, i) => (
            <div key={i} className="odm-mgr-finding">
              <div className="odm-mgr-finding-head">
                <StatusBadge tone={findingSeverityTone[finding.severity]}>
                  {finding.severity}
                </StatusBadge>
                <span style={{ fontWeight: 600 }}>{finding.message}</span>
              </div>
              <div className="odm-mgr-finding-evidence">
                <span style={{ fontWeight: 700, color: 'var(--tx3)' }}>
                  Bằng chứng
                </span>
                {Object.entries(finding.evidence).map(([k, v]) => (
                  <span key={k}>
                    <span style={{ color: 'var(--tx3)' }}>{k}:</span>{' '}
                    <span className="odm-mono" style={{ fontWeight: 600 }}>
                      {v}
                    </span>
                  </span>
                ))}
              </div>
              <div style={{ color: 'var(--tx3)', fontSize: 12 }}>
                Hành động của khách (ai_finding_action):{' '}
                {finding.customerAction ? (
                  <StatusBadge tone="blue">
                    {customerActionLabel[finding.customerAction]}
                  </StatusBadge>
                ) : (
                  '—'
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ResourcePreviewCard({
  query,
}: {
  query: ReturnType<typeof useApiQuery<OrderResourcePreview>>
}) {
  if (query.loading || query.error || !query.data) return null
  const preview = query.data
  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span>Nguồn lực khả dụng</span>
        <span style={{ fontWeight: 500, color: 'var(--tx3)', fontSize: 11.5 }}>
          xem trước · chưa phân công
        </span>
      </div>
      <div className="odm-card-body">
        <div className="odm-mgr-resource-counts">
          <div className="odm-mgr-resource-count">
            <b className="odm-tn">{preview.eligibleDroneCount}</b> drone đủ điều
            kiện
          </div>
          <div className="odm-mgr-resource-count">
            <b className="odm-tn">{preview.eligiblePilotCount}</b> phi công đủ
            điều kiện
          </div>
        </div>
        {preview.topDrones.length > 0 ? (
          <>
            <div
              className="odm-mgr-review-hint"
              style={{ fontWeight: 700, margin: '8px 0 4px' }}
            >
              Top drone
            </div>
            {preview.topDrones.map((d) => (
              <div key={d.name} className="odm-mgr-resource-row">
                <span className="odm-tn" style={{ fontWeight: 700 }}>
                  {d.score}
                </span>
                <span style={{ flex: 1, fontWeight: 600 }}>{d.name}</span>
                <span style={{ color: 'var(--tx3)', fontSize: 12 }}>
                  {d.distanceLabel}
                </span>
              </div>
            ))}
          </>
        ) : null}
        {preview.topPilots.length > 0 ? (
          <>
            <div
              className="odm-mgr-review-hint"
              style={{ fontWeight: 700, margin: '8px 0 4px' }}
            >
              Top phi công
            </div>
            {preview.topPilots.map((p) => (
              <div key={p.name} className="odm-mgr-resource-row">
                <span className="odm-tn" style={{ fontWeight: 700 }}>
                  {p.score}
                </span>
                <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                <span style={{ color: 'var(--tx3)', fontSize: 12 }}>
                  {p.distanceLabel}
                </span>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  )
}

function InternalNoteCard({ orderId }: { orderId: string }) {
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState<{
    note: string
    authorName: string
    updatedAt: string
  } | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  )

  async function handleSave() {
    setStatus('saving')
    try {
      const result = await ordersApi.saveInternalNote(orderId, draft)
      setSaved(result)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="odm-card">
      <div className="odm-card-header">Ghi chú nội bộ</div>
      <div
        className="odm-card-body"
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {saved ? (
          <div className="odm-mgr-review-note-existing">
            <div className="odm-mgr-review-hint">
              {saved.authorName} · {formatVn(saved.updatedAt)}
            </div>
            {saved.note}
          </div>
        ) : null}
        <textarea
          className="odm-inp"
          rows={3}
          placeholder="Thêm ghi chú cho đồng nghiệp (khách không thấy)"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setStatus('idle')
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            disabled={draft.trim().length === 0 || status === 'saving'}
            onClick={handleSave}
          >
            Lưu ghi chú
          </button>
          {status === 'saving' ? (
            <span className="odm-mgr-review-hint">Đang lưu…</span>
          ) : null}
          {status === 'saved' ? (
            <span className="odm-mgr-review-hint">Đã lưu</span>
          ) : null}
          {status === 'error' ? (
            <span style={{ color: 'var(--red-fg)', fontSize: 11.5 }}>
              Lưu thất bại
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ApproveButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setBusy(true)
    setError(null)
    try {
      await ordersApi.approve(orderId)
      window.location.hash = managerHref({ screen: 'missionCreate', orderId })
    } catch {
      setError('Duyệt đơn thất bại, thử lại.')
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="odm-btn odm-btn-ok odm-btn-lg"
        onClick={handleApprove}
        disabled={busy}
      >
        Duyệt và tạo mission
      </button>
      {error ? (
        <span style={{ color: 'var(--red-fg)', fontSize: 11.5 }}>{error}</span>
      ) : null}
    </>
  )
}

function DecisionModal({
  kind,
  orderCode,
  orderId,
  onClose,
  onDone,
}: {
  kind: 'reject' | 'info'
  orderCode: string
  orderId: string
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const chips = kind === 'reject' ? rejectReasonChips : infoReasonChips
  const decision: ApprovalDecision =
    kind === 'reject' ? 'REJECTED' : 'NEED_INFO'

  async function handleConfirm() {
    if (!reason.trim()) {
      setError('Lý do là bắt buộc')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await ordersApi.submitApproval(orderId, { decision, reason })
      onDone()
    } catch {
      setError('Gửi thất bại, thử lại.')
      setBusy(false)
    }
  }

  return (
    <div className="odm-mgr-modal-overlay">
      <div
        className="odm-mgr-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="odm-mgr-modal-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="odm-mgr-modal-head">
          <div>
            <div id="odm-mgr-modal-title" className="odm-mgr-modal-title">
              {kind === 'reject'
                ? `Từ chối đơn ${orderCode}`
                : 'Yêu cầu khách bổ sung thông tin'}
            </div>
            <div className="odm-mgr-review-hint">
              {kind === 'reject'
                ? 'Khách sẽ nhận thông báo kèm lý do. Đơn chuyển sang REJECTED.'
                : 'Đơn quay lại trạng thái cần chỉnh sửa (decision NEED_INFO).'}
            </div>
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>
        <div className="odm-mgr-modal-body">
          <div className="odm-mgr-modal-chips">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                className="odm-mgr-modal-chip"
                onClick={() => setReason(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
          <label>
            <span className="odm-mgr-modal-label">
              Lý do (bắt buộc) <span style={{ color: 'var(--red-fg)' }}>*</span>
            </span>
            <textarea
              className="odm-inp"
              rows={4}
              placeholder="Khách hàng sẽ nhìn thấy nội dung này"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError(null)
              }}
            />
            <div className="odm-mgr-review-hint">
              Lưu vào order_approval.reason
            </div>
            {error ? <div className="odm-mgr-modal-error">{error}</div> : null}
          </label>
        </div>
        <div className="odm-mgr-modal-footer">
          <button type="button" className="odm-btn" onClick={onClose}>
            Huỷ
          </button>
          <button
            type="button"
            className={
              kind === 'reject' ? 'odm-btn odm-btn-rd' : 'odm-btn odm-btn-yl'
            }
            onClick={handleConfirm}
            disabled={busy}
          >
            {kind === 'reject' ? 'Xác nhận từ chối' : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReviewSkeleton({ orderId }: { orderId: string }) {
  return (
    <div className="odm-mgr-dash" aria-busy="true" aria-live="polite">
      <ReviewBreadcrumbHeader orderId={orderId} />
      <div className="odm-mgr-review-grid">
        <div className="odm-mgr-review-col">
          <span className="odm-sk" style={{ width: '100%', height: 90 }} />
          <span className="odm-sk" style={{ width: '100%', height: 300 }} />
          <span className="odm-sk" style={{ width: '100%', height: 180 }} />
        </div>
        <div className="odm-mgr-review-col">
          <span className="odm-sk" style={{ width: '100%', height: 300 }} />
          <span className="odm-sk" style={{ width: '100%', height: 220 }} />
        </div>
      </div>
      <span className="odm-visually-hidden">Đang tải…</span>
    </div>
  )
}
