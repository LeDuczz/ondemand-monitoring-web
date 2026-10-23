import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
import type { OrderDetail } from '../../../types/orders'
import type { Invoice } from '../../../../finance/types'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { planningPaymentGateMessages } from './PlanningPaymentGate.messages'

export function PlanningPaymentGate({
  checkingPayment,
  checkPayment,
  data,
}: {
  checkingPayment: boolean
  checkPayment: () => Promise<void>
  data: {
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    invoice: Invoice | null
  }
}) {
  const { t, locale } = useI18n(planningPaymentGateMessages)
  return (
    <div className="odm-planning-payment-gate" role="status">
      <div className="odm-gate-head">
        <strong>{t.waiting}</strong>
        <Button
          type="button"
          disabled={checkingPayment}
          onClick={() => void checkPayment()}
        >
          {checkingPayment ? t.checking : t.checkPayment}
        </Button>
      </div>
      <p>{t.unlockNote}</p>
      {data.invoice ? (
        <div className="odm-gate-deposit">
          <div
            className="odm-gate-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={data.invoice.depositAmount}
            aria-valuenow={data.invoice.paidAmount}
          >
            <span
              style={{
                width: `${Math.min(
                  100,
                  data.invoice.depositAmount > 0
                    ? (data.invoice.paidAmount / data.invoice.depositAmount) *
                        100
                    : 0,
                )}%`,
              }}
            />
          </div>
          <span>
            {t.paid(
              data.invoice.paidAmount.toLocaleString(locale),
              data.invoice.depositAmount.toLocaleString(locale),
            )}
          </span>
        </div>
      ) : (
        <span>{t.notAccepted}</span>
      )}
    </div>
  )
}
