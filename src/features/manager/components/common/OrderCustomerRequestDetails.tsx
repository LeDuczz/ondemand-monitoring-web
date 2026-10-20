import type { OrderReviewMessages } from '../../pages/OrderReview/OrderReviewPage.messages'
import type { OrderDetail } from '../../types/orders'
import { OrderIcon } from './OrderIcon'
import { humanizeMediaRequirement } from './format'
import { type DetailItem } from './requestDetailTypes'
import {
  visibleItems,
  text,
  resultFormatsFromDeliverables,
  list,
  deliverableSummary,
  addOnItems,
  dateOnly,
  dateTime,
} from './requestDetailHelpers'
import { FactList } from './FactList'
import { FactSection } from './FactSection'

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
      label: (
        <strong>
          {deliverable.deliverableTypeName || t.mediaN(index + 1)}
        </strong>
      ),
      value:
        deliverableSummary(
          deliverable.requirement,
          deliverable.deliverableTypeName,
        ).join(' · ') || t.noData,
    })) ??
    order.mediaRequirements?.map((requirement, index) => ({
      label: t.mediaN(index + 1),
      value: humanizeMediaRequirement(requirement.label, t),
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
      value:
        permit || (order.permitRequired === false ? 'Không áp dụng' : null),
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
        ) : order.permitRequired ? (
          'Chưa cung cấp'
        ) : null,
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

  const hasSummary = Boolean(order.title || order.description)
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
          <FactSection
            title="Mục đích & thông số bay"
            icon="target"
            items={scopeFacts}
          />
          <FactSection
            title="Thông tin hiện trường"
            icon="pin"
            items={siteFacts}
          />
          <FactSection
            title="Quyền & giấy phép"
            icon="shield"
            items={permitFacts}
          />
          <FactSection
            title="Kết quả & dữ liệu"
            icon="database"
            items={resultFacts}
          >
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
            <span className="odm-or-req-fallback-label">
              {t.weatherFallback}
            </span>
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
