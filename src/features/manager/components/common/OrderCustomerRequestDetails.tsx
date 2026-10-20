import type { OrderDetail } from '../../types/orders'
import { FactList } from './FactList'
import {
  addOnItems,
  dateOnly,
  deliverableSummary,
  dateTime,
  list,
  resultFormatsFromDeliverables,
  text,
  useDetailFormat,
  visibleItems,
  type DetailItem,
} from './requestDetailHelpers'
import { requestDetailsHeaderMessages } from './RequestDetailsHeader.messages'
import { Card } from '../../../../shared/components/ui'
import { FactSection } from './FactSection'
import { OrderIcon } from './OrderIcon'
import { useI18n } from '../../../../shared/i18n'
import { orderCustomerRequestDetailsMessages } from './OrderCustomerRequestDetails.messages'

export function OrderCustomerRequestDetails({ order }: { order: OrderDetail }) {
  const { t } = useI18n(orderCustomerRequestDetailsMessages)
  const { t: header } = useI18n(requestDetailsHeaderMessages)
  const f = useDetailFormat()

  const contact =
    [order.siteContactName, order.siteContactPhone]
      .filter(Boolean)
      .join(' · ') || null
  const recurrence =
    order.recurrenceType && order.recurrenceOccurrences
      ? t.lan(text(f, order.recurrenceType), order.recurrenceOccurrences)
      : text(f, order.recurrenceType)
  const permit = [
    text(f, order.permitStatus),
    order.permitNumber,
    order.permitZoneName,
  ]
    .filter(Boolean)
    .join(' · ')
  const resultFormats =
    resultFormatsFromDeliverables(f, order) ?? list(f, order.resultFormats)

  const deliverableFacts: DetailItem[] =
    order.deliverables?.map((deliverable, index) => ({
      label: <strong>{deliverable.deliverableTypeName || t.mediaN(index + 1)}</strong>,
      value:
        deliverableSummary(
          f,
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
      addOnItems(f, deliverable.requirement),
    ) ?? []

  const scopeFacts: DetailItem[] = [
    { label: t.usagePurpose, value: text(f, order.usagePurpose) },
    { label: t.flightPurpose, value: text(f, order.flightPurpose) },
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
  const weatherFallback = text(f, order.weatherFallback)

  const permitFacts: DetailItem[] = [
    {
      label: t.permitRequired,
      value:
        order.permitRequired == null
          ? null
          : order.permitRequired
            ? t.permitRequiredYes
            : t.permitRequiredNo,
    },
    {
      label: t.permitStatus,
      value:
        permit || (order.permitRequired === false ? t.notApplicable : null),
    },
    { label: t.validUntil, value: dateOnly(f, order.permitExpiresOn) },
    {
      label: t.permitFiles,
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
          t.notProvided
        ) : null,
    },
  ]

  const resultFacts: DetailItem[] = [
    ...deliverableFacts,
    { label: t.resultDeadline, value: dateOnly(f, order.resultDeadline) },
    {
      label: t.resultFormats,
      // A deliverable row above already shows the output format and its
      // requirement details, so repeating the format here adds no information.
      value: order.deliverables?.length ? null : resultFormats,
    },
    { label: t.deliveryMethods, value: list(f, order.deliveryMethods) },
    {
      label: t.dataRetention,
      value:
        order.dataRetentionDays != null
          ? t.ngay(order.dataRetentionDays)
          : null,
    },
  ]

  // Technical / legal record: collapsed by default.
  const legalFacts: DetailItem[] = [
    {
      label: t.dataRetention,
      value:
        order.dataRetentionDays != null
          ? t.ngay(order.dataRetentionDays)
          : null,
    },
    { label: t.termsAcceptedAt, value: dateTime(f, order.termsAcceptedAt) },
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
    <Card title={header.customerRequestDetails}>
      <div className="odm-or-req-body">
        {hasSummary ? (
          <div className="odm-or-req-hero">
            {order.title ? <h3>{order.title}</h3> : null}
            {order.description ? <p>{order.description}</p> : null}
          </div>
        ) : null}

        <div className="odm-or-req-section-grid">
          <FactSection
            title={t.sectionScope}
            icon="target"
            items={scopeFacts}
          />
          <FactSection title={t.sectionSite} icon="pin" items={siteFacts} />
          <FactSection
            title={t.sectionPermit}
            icon="shield"
            items={permitFacts}
          />
          <FactSection
            title={t.sectionResult}
            icon="database"
            items={resultFacts}
          >
            {deliverableAddOns.length > 0 ? (
              <div className="odm-or-addon-list">
                <span>{t.additionalRequirements}</span>
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
            <summary>{t.legalAndTerms}</summary>
            <FactList items={legalFacts} />
          </details>
        ) : null}
      </div>
    </Card>
  )
}
