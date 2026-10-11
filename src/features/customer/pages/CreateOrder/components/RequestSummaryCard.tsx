import { Icon, type IconName } from '../../../../../shared/components/Icon'
import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  CustomerConsultation,
  PreferredTimeOption,
  ServiceDeliverableOption,
  ServiceOption,
} from '../../../api/customerApi'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { localizeDeliverableName } from '../../../lib/i18n/catalogNames'
import { localizeTimeslot } from '../../../lib/i18n/timeslots'
import { findPermitZone } from '../../../lib/createOrder/airspace'
import { calcArea } from '../../../lib/createOrder/payload'
import type { FormState, Step } from '../../../lib/createOrder/types'
import { deliveryOptionsCardMessages } from './DeliveryOptionsCard.messages'
import { requestInfoPanelMessages } from './RequestInfoPanel.messages'
import { requestSummaryCardMessages } from './RequestSummaryCard.messages'

type Props = {
  form: FormState
  service?: ServiceOption
  time?: PreferredTimeOption
  deliverable?: ServiceDeliverableOption
  consultation: CustomerConsultation | null
  aiAnalysisRequested: boolean
  onEdit?: (step: Step) => void
}

type Item = {
  key: string
  icon?: IconName
  label: string
  lines: string[]
  clamp?: boolean
  /** Wizard step where this value is edited. */
  step?: Step
}

/** `2026-10-07` → `07/10/2026` for Vietnamese; other values pass through. */
function formatDate(value: string, lang: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match && lang === 'vi' ? `${match[3]}/${match[2]}/${match[1]}` : value
}

/** Read-only, scannable summary of everything the customer entered. */
export function RequestSummaryCard(p: Props) {
  const { t, lang } = useI18n(requestSummaryCardMessages)
  const { t: d } = useI18n(deliveryOptionsCardMessages)
  const { t: info } = useI18n(requestInfoPanelMessages)
  const { form } = p
  const dateFrom = formatDate(form.preferredDateFrom, lang)
  const dateTo = formatDate(form.preferredDateTo, lang)
  const dates = !dateFrom
    ? ''
    : dateTo && dateTo !== dateFrom
      ? `${dateFrom} → ${dateTo}`
      : dateFrom
  const permitZone = findPermitZone(
    { latitude: Number(form.latitude), longitude: Number(form.longitude) },
    form.radiusM,
  )
  const timeWindow = p.time ? localizeTimeslot(p.time, lang) : ''
  const quantity = Number.isFinite(form.quantity) && form.quantity > 0 ? form.quantity : 0
  const result = [
    t[form.mediaType],
    form.resolution,
    quantity ? t.quantityUnit(form.mediaType, quantity) : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const items: Item[] = [
    {
      key: 'service',
      icon: 'clipboard',
      label: t.service,
      lines: [
        p.service ? localizeServiceName(p.service.id, lang, p.service.name) : t.noValue,
        [
          form.usagePurpose ? info.purposes[form.usagePurpose] : '',
          form.priority !== 'NORMAL' ? info.priorities[form.priority] : '',
        ]
          .filter(Boolean)
          .join(' · '),
      ].filter(Boolean),
      step: 1,
    },
    {
      key: 'location',
      icon: 'map-pin',
      label: t.location,
      lines: [form.address || t.noAddress],
      clamp: true,
      step: 3,
    },
    {
      key: 'schedule',
      icon: 'clock',
      label: t.schedule,
      lines: [
        dates || t.noValue,
        timeWindow,
        form.recurrenceType === 'WEEKLY'
          ? t.repeatWeekly(form.recurrenceOccurrences)
          : form.recurrenceType === 'MONTHLY'
            ? t.repeatMonthly(form.recurrenceOccurrences)
            : '',
        form.resultDeadline ? t.deadline(formatDate(form.resultDeadline, lang)) : '',
        t.fallbackValues[form.weatherFallback],
      ].filter(Boolean),
      step: 4,
    },
    {
      key: 'area',
      label: t.area,
      lines: [
        `${t.radius} ${form.radiusM} m · ${calcArea(form.radiusM)} ha`,
        t.altitude(form.altitudeM),
        Number(form.estimatedLengthM) > 0 ? t.length(Number(form.estimatedLengthM)) : '',
        form.areaFiles.length ? t.areaFiles(form.areaFiles.length) : '',
      ].filter(Boolean),
      step: 3,
    },
    ...(form.siteContactName.trim() || form.siteContactPhone.trim() || form.accessNotes.trim()
      ? [
          {
            key: 'contact',
            label: t.contact,
            lines: [
              [form.siteContactName.trim(), form.siteContactPhone.trim()].filter(Boolean).join(' · '),
              form.accessNotes.trim(),
            ].filter(Boolean),
            step: 3 as Step,
          },
        ]
      : []),
    ...(permitZone && form.permitStatus !== 'NONE'
      ? [
          {
            key: 'permit',
            label: t.permit,
            lines: [
              form.permitStatus === 'HAVE_PERMIT'
                ? t.permitHave(form.permitNumber.trim())
                : t.permitSupport,
            ],
            step: 3 as Step,
          },
        ]
      : []),
    {
      key: 'deliverable',
      icon: 'camera',
      label: t.deliverable,
      lines: [
        localizeDeliverableName(p.deliverable?.deliverableTypeName, lang) || t.noValue,
        result,
      ].filter(Boolean),
    },
    {
      key: 'delivery',
      icon: 'file-text',
      label: t.delivery,
      lines: [
        form.resultFormats.map((format) => d.formats[format]).join(', '),
        form.deliveryMethods.map((method) => d.methods[method]).join(', '),
        d.days(form.dataRetentionDays),
      ].filter(Boolean),
    },
    {
      key: 'aiConsultation',
      icon: 'sparkle',
      label: t.aiConsultation,
      lines: [p.consultation?.id ? t.consulted : t.notUsed],
      step: 1,
    },
    {
      key: 'addOns',
      label: t.addOns,
      lines: [p.aiAnalysisRequested ? t.aiAnalysis : t.none],
      step: 1,
    },
    {
      key: 'attachments',
      label: t.attachments,
      lines: [form.attachments.length ? t.attachmentCount(form.attachments.length) : t.none],
      step: 1,
    },
  ]

  return (
    <Card title={t.cardTitle}>
      <p className="co-hint">{t.cardSubtitle}</p>
      <p className="co-sum-title" title={form.title || undefined}>
        {form.title.trim() || t.noTitle}
      </p>
      <dl className="co-sum-list">
        {items.map((item) => (
          <div key={item.key} className="co-sum-item">
            <span className="co-sum-icon" aria-hidden="true">
              {item.icon && <Icon name={item.icon} width={16} height={16} />}
            </span>
            <div className="co-sum-body">
              <dt>{item.label}</dt>
              {item.lines.map((line, index) => (
                <dd
                  key={index}
                  className={`${index > 0 ? 'is-sub ' : ''}${item.clamp ? 'is-clamp' : ''}`}
                  title={item.clamp ? line : undefined}
                >
                  {line}
                </dd>
              ))}
            </div>
            {item.step && p.onEdit && (
              <button
                type="button"
                className="co-sum-edit"
                aria-label={`${t.edit}: ${item.label}`}
                onClick={() => p.onEdit?.(item.step as Step)}
              >
                {t.edit}
              </button>
            )}
          </div>
        ))}
      </dl>
      <details className="co-sum-tech">
        <summary>{t.technical}</summary>
        <div className="co-sum-tech-row">
          <span>{t.coordinates}</span>
          <span className="co-mono">
            {form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : '—'}
          </span>
        </div>
      </details>
    </Card>
  )
}
