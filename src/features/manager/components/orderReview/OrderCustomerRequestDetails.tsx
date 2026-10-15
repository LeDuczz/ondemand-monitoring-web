import type { ReactNode } from 'react'

import type { OrderReviewMessages } from '../../pages/OrderReviewPage.messages'
import type { OrderDetail } from '../../types/orders'
import { OrderIcon, type OrderIconName } from './OrderIcon'

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
  AGRICULTURE: 'Phục vụ nông nghiệp',
  SURVEY_MONITORING: 'Đo đạc, khảo sát, giám sát từ trên cao',
  CONSTRUCTION_MONITORING: 'Giám sát tiến độ công trình',
  INDUSTRIAL_INSPECTION: 'Kiểm tra nhà xưởng và cơ sở sản xuất',
  AREA_MONITORING: 'Giám sát khu vực',
  FOREST_MONITORING: 'Giám sát tài nguyên rừng',
  NORMAL: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
  NONE: 'Không có',
  HAVE_PERMIT: 'Đã có giấy phép',
  NEED_SUPPORT: 'Cần hỗ trợ xin phép',
  WEEKLY: 'Hằng tuần',
  MONTHLY: 'Hằng tháng',
  AUTO_RESCHEDULE:
    'Tự động dời sang ngày phù hợp gần nhất trong khoảng thời gian khách đã chọn',
  CONTACT_CUSTOMER: 'Liên hệ khách hàng trước khi thay đổi lịch bay',
  CANCEL_ORDER: 'Không sắp xếp bay lại và hủy yêu cầu',
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

function resolutionText(value: unknown): string | null {
  const resolution = text(value)
  if (!resolution) return null
  if (resolution.toUpperCase() === '4K') {
    return '4K UHD'
  }
  return resolution
}

function deliverableSummary(
  requirement: Record<string, unknown> | null,
  deliverableName?: string | null,
) {
  if (!requirement) return []
  // The deliverable heading already communicates its media type (for example,
  // "Video"). Only fall back to the requirement media type for generic names.
  const type = mediaTypeFromTitle(deliverableName)
    ? null
    : text(requirement.mediaType)
  return [
    type,
    numberText(requirement.quantity)
      ? `${numberText(requirement.quantity)} ảnh`
      : null,
    resolutionText(requirement.resolution),
    text(requirement.aiAnalysisRequested) === 'Có' ? 'Có AI' : null,
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

function FactSection({
  title,
  icon,
  items,
  children,
}: {
  title: string
  icon: OrderIconName
  items: DetailItem[]
  children?: ReactNode
}) {
  const visible = visibleItems(items)
  if (visible.length === 0 && !children) return null
  return (
    <section className="odm-or-req-section">
      <h4>
        <span aria-hidden="true">
          <OrderIcon name={icon} size={18} />
        </span>
        {title}
      </h4>
      <FactList items={visible} />
      {children}
    </section>
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
  const deliverableFacts: DetailItem[] =
    order.deliverables?.map((deliverable, index) => ({
      label: deliverable.deliverableTypeName || t.mediaN(index + 1),
      value:
        deliverableSummary(
          deliverable.requirement,
          deliverable.deliverableTypeName,
        ).join(' · ') || t.noData,
    })) ??
    order.mediaRequirements?.map((requirement, index) => ({
      label: t.mediaN(index + 1),
      value: requirement.label,
    })) ??
    []
  const deliverableAddOns =
    order.deliverables?.flatMap((deliverable) =>
      addOnItems(deliverable.requirement),
    ) ?? []

  const scopeFacts: DetailItem[] = [
    {
      label: t.usagePurpose,
      value: text(order.usagePurpose),
    },
    {
      label: t.flightPurpose,
      value: text(order.flightPurpose),
    },
    {
      label: t.flightAltitude,
      value: order.altitudeM != null ? `${order.altitudeM} m` : null,
    },
    {
      label: t.estimatedLength,
      value:
        order.estimatedLengthM != null ? `${order.estimatedLengthM} m` : null,
    },
    { label: t.recurrence, value: recurrence },
  ]

  const siteFacts: DetailItem[] = [
    { label: t.siteContact, value: contact },
    { label: t.accessNotes, value: order.accessNotes },
  ]
  const weatherFallback = text(order.weatherFallback)

  const permitFacts: DetailItem[] = [
    {
      label: 'Yêu cầu giấy phép',
      value:
        order.permitRequired == null
          ? null
          : order.permitRequired
            ? 'Có yêu cầu'
            : 'Không yêu cầu',
    },
    {
      label: 'Trạng thái giấy phép',
      value: permit || (order.permitRequired === false ? 'Không áp dụng' : null),
    },
    { label: 'Hiệu lực đến', value: dateOnly(order.permitExpiresOn) },
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
        ) : order.permitRequired
          ? 'Chưa cung cấp'
          : null,
    },
  ]

  const resultFacts: DetailItem[] = [
    ...deliverableFacts,
    {
      label: t.resultDeadline,
      value: dateOnly(order.resultDeadline),
    },
    {
      label: t.resultFormats,
      // A deliverable card below already shows the output format and its
      // requirement details, so repeating the format here adds no information.
      value: order.deliverables?.length ? null : resultFormats,
    },
    {
      label: t.deliveryMethods,
      value: list(order.deliveryMethods),
    },
    {
      label: t.dataRetention,
      value:
        order.dataRetentionDays != null
          ? `${order.dataRetentionDays} ngày`
          : null,
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
  const urgent = order.priority === 'URGENT' || order.priority === 'HIGH'
  const hasSummary = Boolean(
    order.title || order.description || priorityLabel,
  )
  const hasDetails =
    hasSummary ||
    visibleItems([
      ...scopeFacts,
      ...siteFacts,
      ...permitFacts,
      ...resultFacts,
      ...legalFacts,
    ]).length > 0 ||
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
        {priorityLabel ? (
          <div className="odm-or-req-chips">
            {priorityLabel ? (
              <span
                className={`odm-or-req-chip${urgent ? ' is-urgent' : ''}`}
              >
                <span className="odm-or-req-chip-label">{t.priority}:</span>
                <strong>{priorityLabel}</strong>
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

        <div className="odm-or-req-section-grid">
          <FactSection title="Mục đích & thông số bay" icon="target" items={scopeFacts} />
          <FactSection title="Thông tin hiện trường" icon="pin" items={siteFacts} />
          <FactSection title="Quyền & giấy phép" icon="shield" items={permitFacts} />
          <FactSection title="Kết quả & dữ liệu" icon="database" items={resultFacts}>
            {deliverableAddOns.length > 0 ? (
              <div className="odm-or-addon-list">
                <span>Yêu cầu bổ sung</span>
                {deliverableAddOns.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            ) : null}
          </FactSection>
        </div>

        {weatherFallback ? (
          <aside className="odm-or-req-fallback" aria-label={t.weatherFallback}>
            <span className="odm-or-req-fallback-icon" aria-hidden="true">
              <OrderIcon name="alert" size={22} />
            </span>
            <span className="odm-or-req-fallback-label">{t.weatherFallback}</span>
            <strong>{weatherFallback}</strong>
          </aside>
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
