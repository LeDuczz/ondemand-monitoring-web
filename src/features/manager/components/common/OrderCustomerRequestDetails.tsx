import type { OrderDetail } from '../../types/orders'
import { FactList } from './FactList'
import {
  dateOnly,
  dateTime,
  list,
  resultFormatsFromDeliverables,
  text,
  useDetailFormat,
  visibleItems,
  type DetailItem,
} from './requestDetailHelpers'
import { RequestChips } from './RequestDetailsHeader'
import { requestDetailsHeaderMessages } from './RequestDetailsHeader.messages'
import { Card } from '../../../../shared/components/ui'
import { LegacyMediaRequirements } from './LegacyMediaRequirements'
import { RequestDeliverables } from './RequestDeliverables'
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

  // What the manager needs first: how fast, how high, how long, what comes out.
  const keyFacts: DetailItem[] = [
    {
      label: t.flightPurpose,
      value: text(f, order.flightPurpose),
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
    {
      label: t.resultDeadline,
      value: dateOnly(f, order.resultDeadline),
    },
    {
      label: t.resultFormats,
      value: resultFormats,
    },
    {
      label: t.deliveryMethods,
      value: list(f, order.deliveryMethods),
    },
  ]

  // Operational context, still visible but visually secondary.
  const extraFacts: DetailItem[] = [
    { label: t.siteContact, value: contact },
    { label: t.accessNotes, value: order.accessNotes },
    { label: t.permitInfo, value: permit || null },
    {
      label: t.validUntil,
      value: dateOnly(f, order.permitExpiresOn),
    },
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
        ) : null,
    },
    {
      label: t.permitRequired,
      value: text(f, order.permitRequired),
    },
    { label: t.recurrence, value: recurrence },
    {
      label: t.weatherFallback,
      value: text(f, order.weatherFallback),
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

  const priorityLabel = text(f, order.priority)
  const purposeLabel = text(f, order.usagePurpose)
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
    <Card
      title={header.customerRequestDetails}
      actions={
        <RequestChips
          priorityLabel={priorityLabel}
          purposeLabel={purposeLabel}
          urgent={urgent}
        />
      }
    >
      <div className="odm-or-req-body">
        {hasSummary ? (
          <div className="odm-or-req-hero">
            {order.title ? <h3>{order.title}</h3> : null}
            {order.description ? <p>{order.description}</p> : null}
          </div>
        ) : null}

        <FactList items={keyFacts} />

        <LegacyMediaRequirements order={order} />

        <RequestDeliverables order={order} />

        <FactList items={extraFacts} />

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
