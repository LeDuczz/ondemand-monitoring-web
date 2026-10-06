import type { ReactNode } from 'react'

import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  PreferredTimeOption,
  ServiceOption,
  ServicePricingEstimate,
} from '../../../api/customerApi'
import { calcArea } from '../../../lib/createOrder/payload'
import type { FormErrors, FormState, UpdateField } from '../../../lib/createOrder/types'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { localizeTimeslot } from '../../../lib/i18n/timeslots'
import { PricingEstimateCard } from './PricingEstimateCard'
import { ScheduleCard } from './ScheduleCard'
import { scheduleStepMessages } from './ScheduleStep.messages'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  preferredTimes: PreferredTimeOption[]
  service?: ServiceOption
  time?: PreferredTimeOption
  pricingEstimate: ServicePricingEstimate | null
  pricingLoading: boolean
  aiAnalysisRequested: boolean
  /** Wizard actions, rendered in the sticky bottom bar. */
  footer?: ReactNode
}

/** `2026-10-07` → `07/10/2026` for Vietnamese; other values pass through. */
function formatDate(value: string, lang: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match && lang === 'vi' ? `${match[3]}/${match[2]}/${match[1]}` : value
}

/** Whole days between two ISO dates, inclusive; null when either is missing/invalid. */
function inclusiveDays(from: string, to: string) {
  const start = Date.parse(from)
  const end = Date.parse(to)
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null
  return Math.round((end - start) / 86_400_000) + 1
}

/** Step 4: preferred dates and time window, with the request context on the side. */
export function ScheduleStep(p: Props) {
  const { t, lang } = useI18n(scheduleStepMessages)
  const { form } = p
  const from = formatDate(form.preferredDateFrom, lang)
  const to = formatDate(form.preferredDateTo, lang)
  const dates = !from ? t.notSelected : to && to !== from ? `${from} → ${to}` : from
  const days = inclusiveDays(form.preferredDateFrom, form.preferredDateTo)

  return (
    <>
      <div className="co-grid is-service">
        <div className="co-stack">
          <ScheduleCard
            form={form}
            errors={p.errors}
            update={p.update}
            preferredTimes={p.preferredTimes}
          />
        </div>
        <aside className="co-stack co-summary">
          <Card title={t.summaryTitle}>
            <dl className="co-sum-list">
              <div className="co-sum-item">
                <span className="co-sum-icon" aria-hidden="true" />
                <div className="co-sum-body">
                  <dt>{t.service}</dt>
                  <dd>
                    {p.service
                      ? localizeServiceName(p.service.id, lang, p.service.name)
                      : t.notSelected}
                  </dd>
                </div>
              </div>
              <div className="co-sum-item">
                <span className="co-sum-icon" aria-hidden="true" />
                <div className="co-sum-body">
                  <dt>{t.location}</dt>
                  <dd className="is-clamp" title={form.address || undefined}>
                    {form.address || t.noAddress}
                  </dd>
                  <dd className="is-sub">
                    {t.radius(form.radiusM, calcArea(form.radiusM))}
                  </dd>
                </div>
              </div>
              <div className="co-sum-item">
                <span className="co-sum-icon" aria-hidden="true" />
                <div className="co-sum-body">
                  <dt>{t.dates}</dt>
                  <dd>{dates}</dd>
                  {days !== null && <dd className="is-sub">{t.days(days)}</dd>}
                </div>
              </div>
              <div className="co-sum-item">
                <span className="co-sum-icon" aria-hidden="true" />
                <div className="co-sum-body">
                  <dt>{t.timeWindow}</dt>
                  <dd>{p.time ? localizeTimeslot(p.time, lang) : t.notSelected}</dd>
                </div>
              </div>
            </dl>
          </Card>
          <PricingEstimateCard
            estimate={p.pricingEstimate}
            loading={p.pricingLoading}
            hasService={Boolean(p.service)}
            aiAnalysisRequested={p.aiAnalysisRequested}
          />
        </aside>
      </div>
      {p.footer && <div className="co-bottom-bar">{p.footer}</div>}
    </>
  )
}
