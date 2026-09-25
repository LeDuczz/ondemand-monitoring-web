import { useEffect, useRef, useState } from 'react'

import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  SIMULATION_MAP_DEFAULT_CROP,
  simulationMapImageStyle,
  worldToViewportPercent,
} from '../../../shared/lib/simulationMapProjection'
import {
  aiVerdictLabel,
  aiVerdictTone,
  findingSeverityTone,
} from '../../../shared/lib/statusTone'
import { ordersApi } from '../api/ordersApi'
import { env } from '../../../config/env'
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

const SIMULATION_MAP_TOP_IMAGE = '/simulation-viewer/simulation_map_top.png'
const SIMULATION_MAP_VERSION = '20260925113000'
const SIMULATION_MAP_BOUNDS = {
  minX: -417.15933531249993,
  maxX: 415.15933531249993,
  minY: -414.65578218749977,
  maxY: 417.66288843749993,
}
const SIMULATION_MAP_IMAGE_CROP = SIMULATION_MAP_DEFAULT_CROP

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
          <AnalysisCard query={analysisQuery} order={order} />
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
          disabled={!env.useMockApi && import.meta.env.MODE !== 'test'}
          title={!env.useMockApi && import.meta.env.MODE !== 'test' ? 'Backend chưa hỗ trợ yêu cầu bổ sung thông tin' : undefined}
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

function humanizeMediaRequirement(label: string) {
  const jsonStart = label.indexOf('{')
  if (jsonStart === -1) return label

  const title = label.slice(0, jsonStart).replace(/[·\s]+$/, '')
  try {
    const data = JSON.parse(label.slice(jsonStart)) as Record<string, unknown>
    const parts = [
      typeof data.mediaType === 'string' ? data.mediaType : null,
      typeof data.quantity === 'number' ? `${data.quantity} mục` : null,
      typeof data.resolution === 'string' ? data.resolution : null,
      typeof data.radiusM === 'number' ? `${data.radiusM} m` : null,
      typeof data.estimatedAreaHa === 'number' ? `${data.estimatedAreaHa} ha` : null,
    ].filter(Boolean)
    return parts.length > 0 ? `${title} · ${parts.join(' · ')}` : title
  } catch {
    return title || label
  }
}

function buildOrderFallbackAnalysis(order: OrderDetail): OrderAnalysis {
  const findings: OrderAnalysis['findings'] = []

  if (order.center) {
    findings.push({
      severity: 'INFO',
      message: `Đã xác định tọa độ mục tiêu X ${order.center.lon.toFixed(1)} · Y ${order.center.lat.toFixed(1)}.`,
      evidence: {
        center: `${order.center.lat}, ${order.center.lon}`,
        address: order.addressText ?? '—',
      },
      customerAction: null,
    })
  } else {
    findings.push({
      severity: 'WARNING',
      message: 'Đơn chưa có tọa độ mục tiêu rõ ràng, cần bổ sung trước khi tạo mission.',
      evidence: {
        address: order.addressText ?? '—',
      },
      customerAction: null,
    })
  }

  findings.push({
    severity: order.radiusM == null ? 'WARNING' : 'INFO',
    message: order.radiusM == null
      ? 'Chưa có bán kính giám sát, cần xác nhận phạm vi bay.'
      : `Bán kính giám sát khoảng ${order.radiusM} m.`,
    evidence: {
      radius_m: order.radiusM != null ? `${order.radiusM}` : '—',
      service: order.serviceName,
    },
    customerAction: null,
  })

  if (order.purpose) {
    findings.push({
      severity: 'INFO',
      message: 'Mục tiêu giám sát đã có mô tả để đội vận hành lập kế hoạch.',
      evidence: {
        purpose: order.purpose.slice(0, 140),
      },
      customerAction: null,
    })
  }

  const warningCount = findings.filter((finding) => finding.severity === 'WARNING').length
  const blockerCount = findings.filter((finding) => finding.severity === 'BLOCKER').length

  return {
    overallVerdict: blockerCount > 0 ? 'INFEASIBLE' : warningCount > 0 ? 'RISKY' : 'FEASIBLE',
    blockerCount,
    warningCount,
    ruleEngineMs: null,
    createdAt: null,
    llmSummary: `Phân tích nhanh từ thông tin đơn: ${order.serviceName}. ${
      blockerCount > 0
        ? 'Cần xử lý lỗi chặn trước khi duyệt.'
        : warningCount > 0
          ? 'Có một số thông tin cần kiểm tra thêm trước khi tạo mission.'
          : 'Đủ thông tin cơ bản để chuyển sang bước duyệt và tạo mission.'
    }`,
    findings,
  }
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
          <div>{order.customer.email ?? '—'}</div>
          <div>{order.customer.phone ?? '—'}</div>
        </div>
      </div>
    </div>
  )
}

function LocationCard({ order }: { order: OrderDetail }) {
  const target = order.center
    ? worldToViewportPercent({ simX: order.center.lon, simY: order.center.lat }, SIMULATION_MAP_BOUNDS, SIMULATION_MAP_IMAGE_CROP)
    : { x: 50, y: 50 }
  const radiusPx = order.radiusM == null
    ? null
    : Math.min(24, Math.max(4, (order.radiusM / (SIMULATION_MAP_BOUNDS.maxX - SIMULATION_MAP_BOUNDS.minX)) * 100))
  const mapImageUrl = `${env.apiBaseUrl}${SIMULATION_MAP_TOP_IMAGE}?v=${SIMULATION_MAP_VERSION}`
  const imageStyle = simulationMapImageStyle(SIMULATION_MAP_IMAGE_CROP)

  if (!order.center && !order.addressText) {
    return (
      <div className="odm-card">
        <div className="odm-card-header">Vị trí và vùng giám sát</div>
        <div className="odm-card-body odm-mgr-review-nodata">
          Chưa có dữ liệu vị trí cho đơn này.
        </div>
      </div>
    )
  }
  return (
    <div className="odm-card">
      <div className="odm-card-header">Vị trí và vùng giám sát</div>
      <div className="odm-mgr-review-map">
        <img
          className="odm-mgr-review-map-image"
          src={mapImageUrl}
          alt=""
          style={imageStyle}
        />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Bản đồ khu vực giám sát">
          {radiusPx != null && <circle cx={target.x} cy={target.y} r={radiusPx} className="odm-mgr-map-radius" vectorEffect="non-scaling-stroke" />}
          <g transform={`translate(${target.x},${target.y})`}>
            <path
              d="M0 0 C-2.6 -3.1 -3.5 -4.7 -3.5 -6 a3.5 3.5 0 017 0 C3.5 -4.7 2.6 -3.1 0 0z"
              className="odm-mgr-map-pin"
              vectorEffect="non-scaling-stroke"
            />
            <circle cy="-6" r="1.2" className="odm-mgr-map-pin-dot" vectorEffect="non-scaling-stroke" />
          </g>
          <text
            x={target.x}
            y={Math.min(97, target.y + 9)}
            textAnchor="middle"
            className="odm-mgr-map-label"
          >
            TARGET · X {order.center?.lon.toFixed(1) ?? '—'} · Y {order.center?.lat.toFixed(1) ?? '—'}
          </text>
        </svg>
      </div>
      <div className="odm-card-body odm-mgr-review-location-grid">
        <div>
          <div className="odm-mgr-review-hint">address_text</div>
          <div style={{ fontWeight: 600 }}>{order.addressText ?? '—'}</div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">center</div>
          <div className="odm-mono" style={{ fontWeight: 600 }}>
            {order.center ? `${order.center.lat}, ${order.center.lon}` : '—'}
          </div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">radius_m</div>
          <div className="odm-tn" style={{ fontWeight: 600 }}>
            {order.radiusM != null ? `${order.radiusM} m` : '—'}
          </div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">Trạm gần nhất</div>
          <div style={{ fontWeight: 600 }}>{order.nearestBase ?? '—'}</div>
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
            <dd>{order.preferredWindow ?? '—'}</dd>
          </div>
          {order.mediaRequirements == null ? (
            <div>
              <dt>Yêu cầu media</dt>
              <dd>Chưa có dữ liệu</dd>
            </div>
          ) : (
            order.mediaRequirements.map((req, i) => (
              <div key={i}>
                <dt>Media {i + 1}</dt>
                <dd>{humanizeMediaRequirement(req.label)}</dd>
              </div>
            ))
          )}
          <div>
            <dt>Mục đích</dt>
            <dd>{order.purpose ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function AttachmentsCard({ order }: { order: OrderDetail }) {
  if (order.attachments == null) {
    return (
      <div className="odm-card">
        <div className="odm-card-header">Tệp đính kèm</div>
        <div className="odm-card-body odm-mgr-review-nodata">
          Chưa có dữ liệu tệp đính kèm cho đơn này.
        </div>
      </div>
    )
  }
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
  order,
}: {
  query: ReturnType<typeof useApiQuery<OrderAnalysis>>
  order: OrderDetail
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
  const analysis = query.data ?? buildOrderFallbackAnalysis(order)
  const isFallback = !query.data
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
        ) : (
          <span style={{ fontWeight: 500, color: 'var(--tx3)', fontSize: 11.5 }}>
            {isFallback ? 'phân tích nhanh' : null}
          </span>
        )}
      </div>
      <div className="odm-card-body">
        {Boolean(query.error) && (
          <div className="odm-mgr-review-hint" style={{ marginBottom: 10 }}>
            Chưa tải được bản phân tích lưu từ backend, đang hiển thị phân tích nhanh từ dữ liệu đơn.
          </div>
        )}
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
  query: ReturnType<typeof useApiQuery<OrderResourcePreview | null>>
}) {
  if (query.loading) return null
  if (query.error) return null
  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span>Nguồn lực khả dụng</span>
        <span style={{ fontWeight: 500, color: 'var(--tx3)', fontSize: 11.5 }}>
          xem trước · chưa phân công
        </span>
      </div>
      {!query.data ? (
        <div className="odm-card-body odm-mgr-review-nodata">
          Chưa có dữ liệu nguồn lực cho đơn này.
        </div>
      ) : (
        <ResourcePreviewBody preview={query.data} />
      )}
    </div>
  )
}

function ResourcePreviewBody({ preview }: { preview: OrderResourcePreview }) {
  return (
    <>
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
    </>
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
            disabled={(!env.useMockApi && import.meta.env.MODE !== 'test') || draft.trim().length === 0 || status === 'saving'}
            title={!env.useMockApi && import.meta.env.MODE !== 'test' ? 'Backend chưa hỗ trợ ghi chú nội bộ' : undefined}
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
      const mission = await ordersApi.approve(orderId)
      window.location.hash = mission?.id
        ? managerHref({ screen: 'missionDispatch', missionId: mission.id })
        : managerHref({ screen: 'missionCreate', orderId })
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
