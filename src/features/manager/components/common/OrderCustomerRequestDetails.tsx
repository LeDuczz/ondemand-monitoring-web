import type { OrderDetail } from '../../types/orders'
import { FactList } from './FactList'
import {
  dateOnly,
  dateTime,
  list,
  resultFormatsFromDeliverables,
  text,
  visibleItems,
  type DetailItem,
} from './requestDetailHelpers'
import { RequestDetailsHeader } from './RequestDetailsHeader'
import { LegacyMediaRequirements } from './LegacyMediaRequirements'
import { RequestDeliverables } from './RequestDeliverables'
import { useI18n } from '../../../../shared/i18n'
import { orderCustomerRequestDetailsMessages } from './OrderCustomerRequestDetails.messages'

export function OrderCustomerRequestDetails({ order }: { order: OrderDetail }) {
  const { t } = useI18n(orderCustomerRequestDetailsMessages)

  const contact =
    [order.siteContactName, order.siteContactPhone]
      .filter(Boolean)
      .join(' · ') || null
  const recurrence =
    order.recurrenceType && order.recurrenceOccurrences
      ? t.lan(text(order.recurrenceType), order.recurrenceOccurrences)
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
      label: t.validUntil,
      value: dateOnly(order.permitExpiresOn),
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
          ? t.ngay(order.dataRetentionDays)
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
      <RequestDetailsHeader
        priorityLabel={priorityLabel}
        purposeLabel={purposeLabel}
        urgent={urgent}
      />
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

        <LegacyMediaRequirements order={order} />

        <RequestDeliverables order={order} />

        {visibleItems(extraFacts).length > 0 ? (
          <div className="odm-or-req-extra">
            <FactList items={extraFacts} />
          </div>
        ) : null}

        {visibleItems(legalFacts).length > 0 ? (
          <details className="odm-or-req-legal">
            <summary>{t.legalAndTerms}</summary>
            <FactList items={legalFacts} />
          </details>
        ) : null}
      </div>
    </section>
  )
}
