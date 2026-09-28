import { useEffect, useRef, useState } from 'react'

import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n, type Language } from '../../../shared/i18n'
import {
  SIMULATION_MAP_DEFAULT_CROP,
  simulationMapImageStyle,
  worldToViewportPercent,
} from '../../../shared/lib/simulationMapProjection'
import {
  aiVerdictTone,
  findingSeverityTone,
  getAiVerdictLabel,
} from '../../../shared/lib/statusTone'
import { ordersApi } from '../api/ordersApi'
import { env } from '../../../config/env'
import { managerHref } from '../routes'
import { CreateMissionPage } from './CreateMissionPage'
import { orderReviewPageMessages } from './OrderReviewPage.messages'
import type {
  ApprovalDecision,
  OrderAnalysis,
  OrderDetail,
  OrderMissionBrief,
  OrderResourcePreview,
} from '../types/orders'
import '../manager.css'

type PageMessages = (typeof orderReviewPageMessages)['vi']

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
  const { t, lang, locale } = useI18n(orderReviewPageMessages)
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
  const [scheduleBrief, setScheduleBrief] = useState<OrderMissionBrief | null>(
    null,
  )

  if (navigateHome) {
    window.location.hash = managerHref({ screen: 'orderQueue' })
    return null
  }

  if (scheduleBrief) {
    return <CreateMissionPage orderId={scheduleBrief.id} initialBrief={scheduleBrief} />
  }

  if (orderQuery.loading) return <ReviewSkeleton orderId={orderId} t={t} />

  if (orderQuery.error) {
    const is409 =
      orderQuery.error instanceof ApiError && orderQuery.error.status === 409
    return (
      <div className="odm-mgr-dash">
        <ReviewBreadcrumbHeader orderId={orderId} t={t} />
        <div className="odm-card">
          <div className="odm-mgr-review-error">
            <div className="odm-mgr-review-error-icon" aria-hidden="true">
              !
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{t.loadError}</div>
            <div
              style={{ color: 'var(--tx3)', maxWidth: 420, lineHeight: 1.5 }}
            >
              {is409 ? t.error409 : t.errorGeneric}
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
                : t.debugFallback}
            </div>
            <a
              className="odm-btn odm-btn-p"
              href={managerHref({ screen: 'orderQueue' })}
            >
              {t.backToQueue}
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
      <ReviewBreadcrumbHeader orderId={order.code} t={t} />
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">{t.reviewTitle(order.code)}</h1>
          <div className="odm-mgr-dash-date">
            {order.serviceName} ·{' '}
            {t.submittedAt(formatVn(order.submittedAt, locale))}
          </div>
        </div>
        <StatusBadge tone="yellow" size="lg">
          {t.underReview}
        </StatusBadge>
      </div>

      <div className="odm-mgr-review-grid">
        <div className="odm-mgr-review-col">
          <CustomerCard order={order} t={t} />
          <LocationCard order={order} t={t} />
          <ServiceCard order={order} t={t} />
          <AttachmentsCard order={order} t={t} />
        </div>
        <div className="odm-mgr-review-col">
          <AnalysisCard query={analysisQuery} order={order} t={t} lang={lang} />
          <ResourcePreviewCard query={previewQuery} t={t} />
          <InternalNoteCard orderId={order.id} t={t} locale={locale} />
        </div>
      </div>

      <div className="odm-mgr-review-actionbar">
        <span className="odm-mgr-review-actionbar-hint">{t.actionHint}</span>
        <div className="odm-mgr-review-actionbar-actions">
          <button
            type="button"
            className="odm-btn odm-btn-yl odm-btn-lg"
            disabled={!env.useMockApi && import.meta.env.MODE !== 'test'}
            title={
              !env.useMockApi && import.meta.env.MODE !== 'test'
                ? t.requestInfoDisabled
                : undefined
            }
            onClick={() => setModal('info')}
          >
            {t.requestInfo}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-rd odm-btn-lg"
            onClick={() => setModal('reject')}
          >
            {t.reject}
          </button>
          <ApproveButton
            orderId={order.id}
            t={t}
            onApproved={() => setScheduleBrief(toMissionBrief(order))}
          />
        </div>
      </div>

      {modal ? (
        <DecisionModal
          kind={modal}
          orderCode={order.code}
          orderId={order.id}
          onClose={() => setModal(null)}
          onDone={() => setNavigateHome(true)}
          t={t}
        />
      ) : null}
    </div>
  )
}

function toMissionBrief(order: OrderDetail): OrderMissionBrief {
  return {
    id: order.id,
    code: order.code,
    serviceName: order.serviceName,
    customerFullName: order.customer.fullName,
    preferredDate: order.preferredDate,
    preferredTimeName: order.preferredTimeName,
    addressText: order.addressText,
    center: order.center,
    radiusM: order.radiusM,
    nearestBase: order.nearestBase,
    mediaRequirements: order.mediaRequirements,
  }
}

function formatVn(iso: string, locale: 'vi-VN' | 'en-US'): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  if (locale === 'en-US') {
    return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`
  }
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

function humanizeMediaRequirement(label: string, t: PageMessages) {
  const jsonStart = label.indexOf('{')
  if (jsonStart === -1) return label

  const title = label.slice(0, jsonStart).replace(/[·\s]+$/, '')
  try {
    const data = JSON.parse(label.slice(jsonStart)) as Record<string, unknown>
    const parts = [
      typeof data.mediaType === 'string' ? data.mediaType : null,
      typeof data.quantity === 'number' ? t.unit.items(data.quantity) : null,
      typeof data.resolution === 'string' ? data.resolution : null,
      typeof data.radiusM === 'number' ? `${data.radiusM} m` : null,
      typeof data.estimatedAreaHa === 'number'
        ? `${data.estimatedAreaHa} ha`
        : null,
    ].filter(Boolean)
    return parts.length > 0 ? `${title} · ${parts.join(' · ')}` : title
  } catch {
    return title || label
  }
}

function buildOrderFallbackAnalysis(
  order: OrderDetail,
  lang: Language,
): OrderAnalysis {
  const findings: OrderAnalysis['findings'] = []

  if (order.center) {
    findings.push({
      severity: 'INFO',
      message:
        lang === 'en'
          ? `Identified target coordinates X ${order.center.lon.toFixed(1)} · Y ${order.center.lat.toFixed(1)}.`
          : `Đã xác định tọa độ mục tiêu X ${order.center.lon.toFixed(1)} · Y ${order.center.lat.toFixed(1)}.`,
      evidence: {
        center: `${order.center.lat}, ${order.center.lon}`,
        address: order.addressText ?? '—',
      },
      customerAction: null,
    })
  } else {
    findings.push({
      severity: 'WARNING',
      message:
        lang === 'en'
          ? 'The order has no clear target coordinates yet — needs one before a mission can be created.'
          : 'Đơn chưa có tọa độ mục tiêu rõ ràng, cần bổ sung trước khi tạo mission.',
      evidence: {
        address: order.addressText ?? '—',
      },
      customerAction: null,
    })
  }

  findings.push({
    severity: order.radiusM == null ? 'WARNING' : 'INFO',
    message:
      order.radiusM == null
        ? lang === 'en'
          ? 'No monitoring radius yet — needs the flight coverage confirmed.'
          : 'Chưa có bán kính giám sát, cần xác nhận phạm vi bay.'
        : lang === 'en'
          ? `Monitoring radius of about ${order.radiusM} m.`
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
      message:
        lang === 'en'
          ? 'The monitoring target has a description the ops team can plan from.'
          : 'Mục tiêu giám sát đã có mô tả để đội vận hành lập kế hoạch.',
      evidence: {
        purpose: order.purpose.slice(0, 140),
      },
      customerAction: null,
    })
  }

  const warningCount = findings.filter(
    (finding) => finding.severity === 'WARNING',
  ).length
  const blockerCount = findings.filter(
    (finding) => finding.severity === 'BLOCKER',
  ).length

  const llmSummary =
    lang === 'en'
      ? `Quick analysis from the order data: ${order.serviceName}. ${
          blockerCount > 0
            ? 'Blocking issues need to be resolved before approval.'
            : warningCount > 0
              ? 'A few things need double-checking before approval.'
              : 'Enough basic information to move to approval and create the mission.'
        }`
      : `Phân tích nhanh từ thông tin đơn: ${order.serviceName}. ${
          blockerCount > 0
            ? 'Cần xử lý lỗi chặn trước khi duyệt.'
            : warningCount > 0
              ? 'Có một số thông tin cần kiểm tra thêm trước khi tạo mission.'
              : 'Đủ thông tin cơ bản để chuyển sang bước duyệt và tạo mission.'
        }`

  return {
    overallVerdict:
      blockerCount > 0 ? 'INFEASIBLE' : warningCount > 0 ? 'RISKY' : 'FEASIBLE',
    blockerCount,
    warningCount,
    ruleEngineMs: null,
    createdAt: null,
    llmSummary,
    findings,
  }
}

function ReviewBreadcrumbHeader({
  orderId,
  t,
}: {
  orderId: string
  t: PageMessages
}) {
  return (
    <div className="odm-mgr-review-breadcrumb">
      <a href={managerHref({ screen: 'orderQueue' })}>{t.breadcrumb}</a>
      <span aria-hidden="true">/</span>
      <span>{orderId}</span>
    </div>
  )
}

function CustomerCard({ order, t }: { order: OrderDetail; t: PageMessages }) {
  const initials = order.customer.fullName
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <div className="odm-card">
      <div className="odm-card-header">{t.customer}</div>
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

function LocationCard({ order, t }: { order: OrderDetail; t: PageMessages }) {
  const target = order.center
    ? worldToViewportPercent(
        { simX: order.center.lon, simY: order.center.lat },
        SIMULATION_MAP_BOUNDS,
        SIMULATION_MAP_IMAGE_CROP,
      )
    : { x: 50, y: 50 }
  const radiusPx =
    order.radiusM == null
      ? null
      : Math.min(
          24,
          Math.max(
            4,
            (order.radiusM /
              (SIMULATION_MAP_BOUNDS.maxX - SIMULATION_MAP_BOUNDS.minX)) *
              100,
          ),
        )
  const mapImageUrl = `${env.apiBaseUrl}${SIMULATION_MAP_TOP_IMAGE}?v=${SIMULATION_MAP_VERSION}`
  const imageStyle = simulationMapImageStyle(SIMULATION_MAP_IMAGE_CROP)

  if (!order.center && !order.addressText) {
    return (
      <div className="odm-card">
        <div className="odm-card-header">{t.location}</div>
        <div className="odm-card-body odm-mgr-review-nodata">
          {t.noLocationData}
        </div>
      </div>
    )
  }
  return (
    <div className="odm-card">
      <div className="odm-card-header">{t.location}</div>
      <div className="odm-mgr-review-map">
        <img
          className="odm-mgr-review-map-image"
          src={mapImageUrl}
          alt=""
          style={imageStyle}
        />
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label={t.mapAriaLabel}
        >
          {radiusPx != null && (
            <circle
              cx={target.x}
              cy={target.y}
              r={radiusPx}
              className="odm-mgr-map-radius"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <g transform={`translate(${target.x},${target.y})`}>
            <path
              d="M0 0 C-2.6 -3.1 -3.5 -4.7 -3.5 -6 a3.5 3.5 0 017 0 C3.5 -4.7 2.6 -3.1 0 0z"
              className="odm-mgr-map-pin"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cy="-6"
              r="1.2"
              className="odm-mgr-map-pin-dot"
              vectorEffect="non-scaling-stroke"
            />
          </g>
          <text
            x={target.x}
            y={Math.min(97, target.y + 9)}
            textAnchor="middle"
            className="odm-mgr-map-label"
          >
            TARGET · X {order.center?.lon.toFixed(1) ?? '—'} · Y{' '}
            {order.center?.lat.toFixed(1) ?? '—'}
          </text>
        </svg>
      </div>
      <div className="odm-card-body odm-mgr-review-location-grid">
        <div>
          <div className="odm-mgr-review-hint">{t.addressText}</div>
          <div style={{ fontWeight: 600 }}>{order.addressText ?? '—'}</div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">{t.center}</div>
          <div className="odm-mono" style={{ fontWeight: 600 }}>
            {order.center ? `${order.center.lat}, ${order.center.lon}` : '—'}
          </div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">{t.radiusM}</div>
          <div className="odm-tn" style={{ fontWeight: 600 }}>
            {order.radiusM != null ? `${order.radiusM} m` : '—'}
          </div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">{t.nearestBase}</div>
          <div style={{ fontWeight: 600 }}>{order.nearestBase ?? '—'}</div>
        </div>
      </div>
    </div>
  )
}

function ServiceCard({ order, t }: { order: OrderDetail; t: PageMessages }) {
  return (
    <div className="odm-card">
      <div className="odm-card-header">{t.serviceAndMedia}</div>
      <div className="odm-card-body">
        <dl className="odm-mgr-review-kv">
          <div>
            <dt>{t.service}</dt>
            <dd>{order.serviceName}</dd>
          </div>
          <div>
            <dt>{t.preferredWindow}</dt>
            <dd>{order.preferredWindow ?? '—'}</dd>
          </div>
          {order.mediaRequirements == null ? (
            <div>
              <dt>{t.mediaRequirements}</dt>
              <dd>{t.noData}</dd>
            </div>
          ) : (
            order.mediaRequirements.map((req, i) => (
              <div key={i}>
                <dt>{t.mediaN(i + 1)}</dt>
                <dd>{humanizeMediaRequirement(req.label, t)}</dd>
              </div>
            ))
          )}
          <div>
            <dt>{t.purpose}</dt>
            <dd>{order.purpose ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function AttachmentsCard({
  order,
  t,
}: {
  order: OrderDetail
  t: PageMessages
}) {
  if (order.attachments == null) {
    return (
      <div className="odm-card">
        <div className="odm-card-header">{t.attachments}</div>
        <div className="odm-card-body odm-mgr-review-nodata">
          {t.noAttachmentsData}
        </div>
      </div>
    )
  }
  if (order.attachments.length === 0) return null
  return (
    <div className="odm-card">
      <div className="odm-card-header">{t.attachments}</div>
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
              {t.download}
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
  t,
  lang,
}: {
  query: ReturnType<typeof useApiQuery<OrderAnalysis>>
  order: OrderDetail
  t: PageMessages
  lang: Language
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
  const analysis = query.data ?? buildOrderFallbackAnalysis(order, lang)
  const isFallback = !query.data
  const tone = aiVerdictTone[analysis.overallVerdict]
  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span>{t.aiAnalysis}</span>
        {analysis.ruleEngineMs ? (
          <span
            style={{ fontWeight: 500, color: 'var(--tx3)', fontSize: 11.5 }}
          >
            rule {analysis.ruleEngineMs} ms
          </span>
        ) : (
          <span
            style={{ fontWeight: 500, color: 'var(--tx3)', fontSize: 11.5 }}
          >
            {isFallback ? t.quickAnalysis : null}
          </span>
        )}
      </div>
      <div className="odm-card-body">
        {Boolean(query.error) && (
          <div className="odm-mgr-review-hint" style={{ marginBottom: 10 }}>
            {t.analysisLoadError}
          </div>
        )}
        <div className={`odm-mgr-verdict-banner odm-mgr-verdict-${tone}`}>
          <span className="odm-mgr-verdict-icon" aria-hidden="true">
            {analysis.overallVerdict === 'FEASIBLE' ? '✓' : '!'}
          </span>
          <div style={{ flex: 1 }}>
            <div className="odm-mgr-verdict-title">
              {getAiVerdictLabel(analysis.overallVerdict, lang).toUpperCase()}{' '}
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
            {t.noFindings}
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
                  {t.evidence}
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
                {t.customerActionLine}{' '}
                {finding.customerAction ? (
                  <StatusBadge tone="blue">
                    {t.customerActionLabel[finding.customerAction]}
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
  t,
}: {
  query: ReturnType<typeof useApiQuery<OrderResourcePreview | null>>
  t: PageMessages
}) {
  if (query.loading) return null
  if (query.error) return null
  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span>{t.resourcePreview}</span>
        <span style={{ fontWeight: 500, color: 'var(--tx3)', fontSize: 11.5 }}>
          {t.previewNotAssigned}
        </span>
      </div>
      {!query.data ? (
        <div className="odm-card-body odm-mgr-review-nodata">
          {t.noResourceData}
        </div>
      ) : (
        <ResourcePreviewBody preview={query.data} t={t} />
      )}
    </div>
  )
}

function ResourcePreviewBody({
  preview,
  t,
}: {
  preview: OrderResourcePreview
  t: PageMessages
}) {
  return (
    <>
      <div className="odm-card-body">
        <div className="odm-mgr-resource-counts">
          <div className="odm-mgr-resource-count">
            <b className="odm-tn">{preview.eligibleDroneCount}</b>{' '}
            {t.eligibleDrones}
          </div>
          <div className="odm-mgr-resource-count">
            <b className="odm-tn">{preview.eligiblePilotCount}</b>{' '}
            {t.eligiblePilots}
          </div>
        </div>
        {preview.topDrones.length > 0 ? (
          <>
            <div
              className="odm-mgr-review-hint"
              style={{ fontWeight: 700, margin: '8px 0 4px' }}
            >
              {t.topDrones}
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
              {t.topPilots}
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

function InternalNoteCard({
  orderId,
  t,
  locale,
}: {
  orderId: string
  t: PageMessages
  locale: 'vi-VN' | 'en-US'
}) {
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
      <div className="odm-card-header">{t.internalNote}</div>
      <div
        className="odm-card-body"
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {saved ? (
          <div className="odm-mgr-review-note-existing">
            <div className="odm-mgr-review-hint">
              {saved.authorName} · {formatVn(saved.updatedAt, locale)}
            </div>
            {saved.note}
          </div>
        ) : null}
        <textarea
          className="odm-inp"
          rows={3}
          placeholder={t.internalNotePlaceholder}
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
            disabled={
              (!env.useMockApi && import.meta.env.MODE !== 'test') ||
              draft.trim().length === 0 ||
              status === 'saving'
            }
            title={
              !env.useMockApi && import.meta.env.MODE !== 'test'
                ? t.internalNoteDisabled
                : undefined
            }
            onClick={handleSave}
          >
            {t.saveNote}
          </button>
          {status === 'saving' ? (
            <span className="odm-mgr-review-hint">{t.saving}</span>
          ) : null}
          {status === 'saved' ? (
            <span className="odm-mgr-review-hint">{t.saved}</span>
          ) : null}
          {status === 'error' ? (
            <span style={{ color: 'var(--red-fg)', fontSize: 11.5 }}>
              {t.saveFailed}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ApproveButton({
  orderId,
  t,
  onApproved,
}: {
  orderId: string
  t: PageMessages
  onApproved: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setBusy(true)
    setError(null)
    try {
      await ordersApi.approve(orderId)
      onApproved()
    } catch {
      setError(t.approveFailed)
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
        {t.approveAndCreateMission}
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
  t,
}: {
  kind: 'reject' | 'info'
  orderCode: string
  orderId: string
  onClose: () => void
  onDone: () => void
  t: PageMessages
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

  const chips = kind === 'reject' ? t.rejectReasonChips : t.infoReasonChips
  const decision: ApprovalDecision =
    kind === 'reject' ? 'REJECTED' : 'NEED_INFO'

  async function handleConfirm() {
    if (!reason.trim()) {
      setError(t.reasonRequired)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await ordersApi.submitApproval(orderId, { decision, reason })
      onDone()
    } catch {
      setError(t.submitFailed)
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
                ? t.rejectModalTitle(orderCode)
                : t.infoModalTitle}
            </div>
            <div className="odm-mgr-review-hint">
              {kind === 'reject' ? t.rejectModalHint : t.infoModalHint}
            </div>
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
            onClick={onClose}
            aria-label={t.close}
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
              {t.reasonLabel} <span style={{ color: 'var(--red-fg)' }}>*</span>
            </span>
            <textarea
              className="odm-inp"
              rows={4}
              placeholder={t.reasonPlaceholder}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError(null)
              }}
            />
            <div className="odm-mgr-review-hint">{t.reasonSavedHint}</div>
            {error ? <div className="odm-mgr-modal-error">{error}</div> : null}
          </label>
        </div>
        <div className="odm-mgr-modal-footer">
          <button type="button" className="odm-btn" onClick={onClose}>
            {t.cancel}
          </button>
          <button
            type="button"
            className={
              kind === 'reject' ? 'odm-btn odm-btn-rd' : 'odm-btn odm-btn-yl'
            }
            onClick={handleConfirm}
            disabled={busy}
          >
            {kind === 'reject' ? t.confirmReject : t.sendRequest}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReviewSkeleton({ orderId, t }: { orderId: string; t: PageMessages }) {
  return (
    <div className="odm-mgr-dash" aria-busy="true" aria-live="polite">
      <ReviewBreadcrumbHeader orderId={orderId} t={t} />
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
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
