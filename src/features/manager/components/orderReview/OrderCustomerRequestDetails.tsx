import type { ReactNode } from 'react'

import type { OrderReviewMessages } from '../../pages/OrderReviewPage.messages'
import type { OrderDetail } from '../../types/orders'
import { OrderIcon } from './OrderIcon'

type DetailItem = {
  label: string
  value: ReactNode
}

const enumLabels: Record<string, string> = {
  INTERNAL: 'Nội bộ',
  LEGAL: 'Pháp lý',
  PARTNER_REPORT: 'Báo cáo cho đối tác',
  OTHER: 'Khác',
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
    return trimmed ? enumLabels[trimmed] ?? trimmed : null
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

function DetailGrid({ items }: { items: DetailItem[] }) {
  const visible = visibleItems(items)
  if (visible.length === 0) return null
  return (
    <div className="odm-or-detail-grid">
      {visible.map((item) => (
        <div key={item.label} className="odm-or-detail-metric">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
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
      record.additionalPrice != null ? `${text(record.additionalPrice)} đ` : null,
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
  const type = mediaTypeFromTitle(deliverableName) ?? text(requirement.mediaType)
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
        key === 'additionalPrice' ? (formatMoney(value) ?? formatted) : formatted
      return {
        label: labels[key] ?? key,
        value: `${finalValue}${suffix}`,
      }
    })
    .filter((item): item is DetailItem => item != null)
}

export function OrderCustomerRequestDetails({
  order,
  t,
}: {
  order: OrderDetail
  t: OrderReviewMessages
}) {
  const contact =
    [order.siteContactName, order.siteContactPhone].filter(Boolean).join(' · ') ||
    null
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

  const summaryItems: DetailItem[] = [
    { label: t.orderTitle, value: order.title },
    { label: t.requestDescription, value: order.description },
    { label: t.usagePurpose, value: text(order.usagePurpose) },
    { label: t.priority, value: text(order.priority) },
    {
      label: t.flightAltitude,
      value: order.altitudeM != null ? `${order.altitudeM} m` : null,
    },
    {
      label: t.estimatedLength,
      value:
        order.estimatedLengthM != null ? `${order.estimatedLengthM} m` : null,
    },
    { label: t.siteContact, value: contact },
    { label: t.accessNotes, value: order.accessNotes },
    { label: t.permitInfo, value: permit || null },
    { label: t.permitRequired, value: text(order.permitRequired) },
    { label: t.recurrence, value: recurrence },
    { label: t.weatherFallback, value: text(order.weatherFallback) },
    { label: t.resultDeadline, value: dateOnly(order.resultDeadline) },
    { label: t.resultFormats, value: resultFormats },
    { label: t.deliveryMethods, value: list(order.deliveryMethods) },
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

  const hasDetails =
    visibleItems(summaryItems).length > 0 ||
    (order.deliverables != null && order.deliverables.length > 0)

  if (!hasDetails) return null

  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="file" size={18} />
          {t.customerRequestDetails}
        </span>
      </header>
      <div className="odm-or-card-body odm-or-detail-stack">
        <section className="odm-or-detail-section">
          <div className="odm-or-detail-section-head">
            <h3>{t.customerEnteredInfo}</h3>
          </div>
          <DetailGrid items={summaryItems} />
        </section>

        {order.deliverables?.map((deliverable, index) => {
          const items = requirementItems(deliverable.requirement)
          const summary = deliverableSummary(
            deliverable.requirement,
            deliverable.deliverableTypeName,
          )
          const addOns = addOnItems(deliverable.requirement)
          return (
            <section
              key={deliverable.id || `${deliverable.deliverableTypeId}-${index}`}
              className="odm-or-detail-section"
            >
              <div className="odm-or-detail-section-head">
                <h3>
                  {deliverable.deliverableTypeName ||
                    `${t.mediaN(index + 1)}`}
                </h3>
                {deliverable.defaultFormat &&
                deliverable.defaultFormat !== deliverable.deliverableTypeName ? (
                  <span className="odm-or-pill">
                    {text(deliverable.defaultFormat) ?? deliverable.defaultFormat}
                  </span>
                ) : null}
              </div>
              {summary.length > 0 ? (
                <div className="odm-or-package-summary">
                  {summary.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              ) : null}
              {addOns.length > 0 ? (
                <div className="odm-or-addon-list">
                  <span>Yêu cầu bổ sung</span>
                  {addOns.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              ) : null}
              {items.length > 0 ? <DetailGrid items={items} /> : null}
              {summary.length === 0 && addOns.length === 0 && items.length === 0 ? (
                <p className="odm-or-detail-note">{t.noData}</p>
              ) : null}
            </section>
          )
        })}
      </div>
    </section>
  )
}
