import { Card } from '../../../../../shared/components/ui'
import { useI18n, useLanguage } from '../../../../../shared/i18n'
import type { OrderStatus } from '../../../../../shared/types/domain'
import { OrderIcon, type OrderIconName } from '../../../../manager/components/orderReview/OrderIcon'
import { fmtDateTime, getOrderStatusMeta } from '../../../lib/orderStatus'
import { buildOrderSteps } from '../../../lib/orders/orderSteps'
import type { OrderStep, OrderStepKey, OrderTimelineEvent } from '../../../lib/orders/types'
import { CardTitle } from './CardTitle'
import { orderTimelineMessages } from './OrderTimeline.messages'

/** Terminal steps are the same thing as an order status, so they reuse its label. */
const TERMINAL_STATUS: Partial<Record<OrderStepKey, OrderStatus>> = {
  rejected: 'REJECTED',
  cancelled: 'CANCELLED',
}

const MARKER_ICON: Partial<Record<OrderStep['state'], OrderIconName>> = {
  done: 'check',
  failed: 'x',
  cancelled: 'minus',
}

/** Vertical progress stepper derived from the status and the few dates the BE returns. */
export function OrderTimeline({ status, events }: { status: OrderStatus; events: OrderTimelineEvent[] }) {
  const { t, locale } = useI18n(orderTimelineMessages)
  const { lang } = useLanguage()
  const steps = buildOrderSteps(status, events)
  if (steps.length === 0) return null

  const stageLabel: Record<OrderStepKey, string> = {
    submitted: t.stepSubmitted,
    approved: t.stepReview,
    inProgress: t.stepMonitoring,
    completed: t.stepCompleted,
    rejected: '',
    cancelled: '',
  }
  const label = (step: OrderStep) => {
    const terminal = TERMINAL_STATUS[step.key]
    return terminal ? getOrderStatusMeta(terminal, lang).label : stageLabel[step.key]
  }
  const hint = (step: OrderStep) => {
    if (step.state !== 'current') return null
    if (step.key === 'approved') return t.hintReview
    return status === 'IN_PROGRESS' ? t.hintRunning : t.hintWaiting
  }

  return (
    <Card title={<CardTitle icon="clock">{t.title}</CardTitle>}>
      <ol className="od-steps">
        {steps.map((step) => {
          const icon = MARKER_ICON[step.state]
          const stepHint = hint(step)
          return (
            <li
              key={step.key}
              className={`od-step is-${step.state}`}
              aria-current={step.state === 'current' ? 'step' : undefined}
            >
              <span className="od-step-marker" aria-hidden="true">
                {icon && <OrderIcon name={icon} size={14} />}
              </span>
              <div className="od-step-body">
                <div className="od-step-label">{label(step)}</div>
                {stepHint && <div className="od-step-hint">{stepHint}</div>}
                {step.at && (
                  <div className="od-step-meta">
                    {fmtDateTime(step.at, locale)}
                    {step.actor ? ` · ${t.by(step.actor)}` : ''}
                  </div>
                )}
                {step.note && <div className="od-step-note">{step.note}</div>}
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
