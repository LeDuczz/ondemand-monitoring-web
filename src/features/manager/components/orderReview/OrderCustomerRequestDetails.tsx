import type { ReactNode } from 'react'

import type { OrderReviewMessages } from '../../pages/OrderReviewPage.messages'
import type { OrderDetail } from '../../types/orders'
import { OrderIcon, type OrderIconName } from './OrderIcon'
import { humanizeMediaRequirement } from './format'

type DetailItem = {
  label: string
  value: ReactNode
  icon?: OrderIconName
  tone?: 'green' | 'blue' | 'orange' | 'purple'
}

const enumLabels: Record<string, string> = {
  INTERNAL: 'Nội bộ',
  LEGAL: 'Pháp lý',
  PARTNER_REPORT: 'Báo cáo cho đối tác',
  OTHER: 'Khác',
  AGRICULTURE: 'Phục vụ sản xuất nông nghiệp',
  SURVEY_MONITORING: 'Đo đạc, khảo sát, giám sát từ trên cao',
  NORMAL: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
  NONE: 'Không có',
  HAVE_PERMIT: 'Đã có giấy phép',
  NEED_SUPPORT: 'Cần hỗ trợ xin phép',
  WEEKLY: 'Hằng tuần',
  MONTHLY: 'Hằng tháng',
  AUTO_RESCHEDULE: 'Tự dời lịch',
  CONTACT_CUSTOMER: 'Liên hệ khách trước',
  CANCEL_ORDER: 'Huỷ yêu cầu',
  PHOTO: 'Ảnh',
  IMAGE: 'Ảnh',
  VIDEO: 'Video',
  PDF_REPORT: 'Báo cáo PDF',
  ORTHOMOSAIC: 'Bản đồ ghép ảnh',
  MODEL_3D: 'Mô hình 3D',
  PDF: 'PDF',
  DOWNLOAD: 'Tải về',
  EMAIL: 'Email',
  API: 'API',
  AI_IMAGE_ANALYSIS: 'AI phân tích hình ảnh',
}

function text(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? (enumLabels[trimmed] ?? trimmed) : null
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? 'Có' : 'Không'
  return null
}

function list(values: string[] | null | undefined): string | null {
  if (!values || values.length === 0) return null
  return values.map((value) => text(value) ?? value).join(', ')
}

function dateOnly(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function dateTime(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

function visibleItems(items: DetailItem[]) {
  return items.filter((item) => item.value != null && item.value !== '')
}

function requirementValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    const values = value.map(requirementValue).filter(Boolean)
    return values.length ? values.join(', ') : null
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const parts = [
      text(record.type),
      text(record.description),
      record.additionalPrice != null
        ? `${text(record.additionalPrice)} đ`
        : null,
      text(record.fileName ?? record.name),
    ].filter(Boolean)
    return parts.length ? parts.join(' · ') : null
  }
  return text(value)
}

function mediaTypeFromTitle(title: string | null | undefined) {
  const normalized = title?.trim().toLowerCase() ?? ''
  if (normalized.includes('video')) return 'Video'
  if (
    normalized.includes('ảnh') ||
    normalized.includes('hình') ||
    normalized.includes('photo') ||
    normalized.includes('image')
  ) {
    return 'Ảnh'
  }
  if (normalized.includes('báo cáo') || normalized.includes('report')) {
    return 'Báo cáo'
  }
  return null
}

function formatMoney(value: unknown) {
  const amount =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : null
  return amount != null && Number.isFinite(amount)
    ? amount.toLocaleString('vi-VN') + ' đ'
    : text(value)
}

function numberText(value: unknown): string | null {
  const valueText = text(value)
  return valueText && valueText !== '0' ? valueText : null
}

function deliverableSummary(
  requirement: Record<string, unknown> | null,
  deliverableName?: string | null,
) {
  if (!requirement) return []
  const type =
    mediaTypeFromTitle(deliverableName) ?? text(requirement.mediaType)
  return [
    type,
    numberText(requirement.quantity)
      ? `${numberText(requirement.quantity)} mục`
      : null,
    text(requirement.resolution),
    text(requirement.aiAnalysisRequested) === 'Có' ? 'Có phân tích AI' : null,
  ].filter((item): item is string => Boolean(item))
}

function resultFormatsFromDeliverables(order: OrderDetail): string | null {
  const formats =
    order.deliverables
      ?.map((deliverable) => {
        const fromName = mediaTypeFromTitle(deliverable.deliverableTypeName)
        if (fromName) return fromName
        return text(deliverable.requirement?.mediaType)
      })
      .filter((item): item is string => Boolean(item)) ?? []

  const uniqueFormats = [...new Set(formats)]
  return uniqueFormats.length > 0 ? uniqueFormats.join(', ') : null
}

function addOnItems(requirement: Record<string, unknown> | null): string[] {
  const value = requirement?.additionalRequirements
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return requirementValue(item)
      const record = item as Record<string, unknown>
      const title = text(record.type) ?? 'Yêu cầu bổ sung'
      const description = text(record.description)
      const price = formatMoney(record.additionalPrice)
      return [title, description, price].filter(Boolean).join(' · ')
    })
    .filter((item): item is string => Boolean(item))
}

function requirementItems(
  requirement: Record<string, unknown> | null,
): DetailItem[] {
  if (!requirement) return []
  const labels: Record<string, string> = {
    mediaType: 'Loại media',
    quantity: 'Số lượng',
    resolution: 'Độ phân giải',
    radiusM: 'Bán kính',
    estimatedAreaHa: 'Diện tích',
    aiAnalysisRequested: 'Phân tích AI',
    additionalRequirements: 'Yêu cầu thêm',
    type: 'Loại',
    description: 'Mô tả',
    additionalPrice: 'Phí bổ sung',
    areaFiles: 'Tệp khu vực',
    customerAttachments: 'Tệp khách gửi',
  }
  const hiddenTechnicalKeys = new Set([
    'priority',
    'readinessScore',
    'usagePurpose',
    'serviceCode',
    'serviceId',
    'deliverableTypeId',
    'mediaType',
    'quantity',
    'resolution',
    'radiusM',
    'estimatedAreaHa',
    'aiAnalysisRequested',
    'additionalRequirements',
  ])

  return Object.entries(requirement)
    .map<DetailItem | null>(([key, value]) => {
      if (hiddenTechnicalKeys.has(key)) return null
      const formatted = requirementValue(value)
      if (!formatted) return null
      const suffix =
        key === 'radiusM' ? ' m' : key === 'estimatedAreaHa' ? ' ha' : ''
      const finalValue =
        key === 'additionalPrice'
          ? (formatMoney(value) ?? formatted)
          : formatted
      return {
        label: labels[key] ?? key,
        value: `${finalValue}${suffix}`,
      }
    })
    .filter((item): item is DetailItem => item != null)
}

function FactList({ items }: { items: DetailItem[] }) {
  const visible = visibleItems(items)
  if (visible.length === 0) return null
  return (
    <dl className="odm-or-req-facts">
      {visible.map((item) => (
        <div
          key={item.label}
          className={
            item.icon
              ? `has-icon${item.tone ? ` tone-${item.tone}` : ''}`
              : undefined
          }
        >
          <dt>
            {item.icon ? (
              <span className="odm-or-req-ico" aria-hidden="true">
                <OrderIcon name={item.icon} size={20} />
              </span>
            ) : null}
            <span>{item.label}</span>
          </dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function OrderCustomerRequestDetails({
  order,
  t,
}: {
  order: OrderDetail
  t: OrderReviewMessages
}) {
  const contact =
    [order.siteContactName, order.siteContactPhone]
      .filter(Boolean)
      .join(' · ') || null
  const recurrence =
    order.recurrenceType && order.recurrenceOccurrences
      ? `${text(order.recurrenceType)} · ${order.recurrenceOccurrences} lần`
      : text(order.recurrenceType)
  const permit = [
    text(order.permitStatus),
    order.permitNumber,
    order.permitZoneName,
  ]
    .filter(Boolean)
    .join(' · ')
  const resultFormats =
    resultFormatsFromDeliverables(order) ?? list(order.resultFormats)

  // What the manager needs first: how fast, how high, how long, what comes out.
  const keyFacts: DetailItem[] = [
    {
      label: t.flightPurpose,
      icon: 'target',
      tone: 'green',
      value: text(order.flightPurpose),
    },
    {
      label: t.flightAltitude,
      icon: 'altitude',
      tone: 'blue',
      value: order.altitudeM != null ? `${order.altitudeM} m` : null,
    },
    {
      label: t.estimatedLength,
      icon: 'radius',
      value:
        order.estimatedLengthM != null ? `${order.estimatedLengthM} m` : null,
    },
    {
      label: t.resultDeadline,
      icon: 'clock',
      tone: 'blue',
      value: dateOnly(order.resultDeadline),
    },
    {
      label: t.resultFormats,
      icon: 'doc',
      tone: 'orange',
      value: resultFormats,
    },
    {
      label: t.deliveryMethods,
      icon: 'download',
      tone: 'purple',
      value: list(order.deliveryMethods),
    },
  ]

  // Operational context, still visible but visually secondary.
  const extraFacts: DetailItem[] = [
    { label: t.siteContact, icon: 'user', value: contact },
    { label: t.accessNotes, icon: 'info', value: order.accessNotes },
    { label: t.permitInfo, icon: 'doc', tone: 'blue', value: permit || null },
    {
      label: 'Hiệu lực đến',
      value: dateOnly(order.permitExpiresOn),
    },
    {
      label: 'Tệp giấy phép',
      value:
        order.permitDocuments && order.permitDocuments.length > 0 ? (
          <span className="odm-or-req-files">
            {order.permitDocuments.map((file) => (
              <a
                key={file.id}
                href={file.dataUrl}
                download={file.fileName}
                title={file.fileName}
              >
                {file.fileName}
              </a>
            ))}
          </span>
        ) : null,
    },
    {
      label: t.permitRequired,
      icon: 'shield',
      tone: 'green',
      value: text(order.permitRequired),
    },
    { label: t.recurrence, icon: 'refresh', tone: 'orange', value: recurrence },
    {
      label: t.weatherFallback,
      icon: 'cloud',
      tone: 'purple',
      value: text(order.weatherFallback),
    },
  ]

  // Technical / legal record: collapsed by default.
  const legalFacts: DetailItem[] = [
    {
      label: t.dataRetention,
      value:
        order.dataRetentionDays != null
          ? `${order.dataRetentionDays} ngày`
          : null,
    },
    { label: t.termsAcceptedAt, value: dateTime(order.termsAcceptedAt) },
    { label: t.termsVersion, value: order.termsVersion },
  ]

  const priorityLabel = text(order.priority)
  const purposeLabel = text(order.usagePurpose)
  const urgent = order.priority === 'URGENT' || order.priority === 'HIGH'
  const hasSummary = Boolean(
    order.title || order.description || priorityLabel || purposeLabel,
  )
  const hasDetails =
    hasSummary ||
    visibleItems([...keyFacts, ...extraFacts, ...legalFacts]).length > 0 ||
    (order.deliverables != null && order.deliverables.length > 0) ||
    (order.mediaRequirements != null && order.mediaRequirements.length > 0)

  if (!hasDetails) return null

  return (
    <section className="odm-or-card odm-or-req">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="file" size={18} />
          {t.customerRequestDetails}
        </span>
        {priorityLabel || purposeLabel ? (
          <div className="odm-or-req-chips">
            {priorityLabel ? (
              <span
                className={`odm-or-req-chip${urgent ? ' is-urgent' : ''}`}
                title={t.priority}
              >
                {priorityLabel}
              </span>
            ) : null}
            {purposeLabel ? (
              <span className="odm-or-req-chip" title={t.usagePurpose}>
                {purposeLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </header>
      <div className="odm-or-card-body odm-or-req-body">
        {hasSummary ? (
          <div className="odm-or-req-hero">
            <div className="odm-or-req-hero-text">
              {order.title ? <h3>{order.title}</h3> : null}
              {order.description ? <p>{order.description}</p> : null}
            </div>
          </div>
        ) : null}

        <FactList items={keyFacts} />

        {!order.deliverables?.length && order.mediaRequirements?.length ? (
          <div className="odm-or-req-deliverables">
            {order.mediaRequirements.map((requirement, index) => (
              <p key={index}>
                {humanizeMediaRequirement(requirement.label, t)}
              </p>
            ))}
          </div>
        ) : null}

        {order.deliverables?.map((deliverable, index) => {
          const items = requirementItems(deliverable.requirement)
          const summary = deliverableSummary(
            deliverable.requirement,
            deliverable.deliverableTypeName,
          )
          const addOns = addOnItems(deliverable.requirement)
          return (
            <div
              key={
                deliverable.id || `${deliverable.deliverableTypeId}-${index}`
              }
              className="odm-or-req-deliverable"
            >
              <div className="odm-or-req-deliverable-head">
                <strong>
                  {deliverable.deliverableTypeName || `${t.mediaN(index + 1)}`}
                </strong>
                {summary.length > 0 ? (
                  <span className="odm-or-req-summary">
                    {summary.join(' · ')}
                  </span>
                ) : null}
              </div>
              {addOns.length > 0 ? (
                <div className="odm-or-addon-list">
                  <span>Yêu cầu bổ sung</span>
                  {addOns.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              ) : null}
              {items.length > 0 ? <FactList items={items} /> : null}
              {summary.length === 0 &&
              addOns.length === 0 &&
              items.length === 0 ? (
                <p className="odm-or-detail-note">{t.noData}</p>
              ) : null}
            </div>
          )
        })}

        {visibleItems(extraFacts).length > 0 ? (
          <div className="odm-or-req-extra">
            <FactList items={extraFacts} />
          </div>
        ) : null}

        {visibleItems(legalFacts).length > 0 ? (
          <details className="odm-or-req-legal">
            <summary>Pháp lý và điều khoản</summary>
            <FactList items={legalFacts} />
          </details>
        ) : null}
      </div>
    </section>
  )
}
