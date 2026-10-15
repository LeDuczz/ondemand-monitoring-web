import type { OrderDetail } from '../../types/orders'
import { Card } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { orderCustomerCardMessages } from './OrderCustomerCard.messages'

export function OrderCustomerCard({ order }: { order: OrderDetail }) {
  const { t } = useI18n(orderCustomerCardMessages)

  const { customer } = order
  const hasCompany = Boolean(customer.companyName?.trim())
  const rows: Array<{ label: string; value: string | null; empty: string }> = [
    { label: t.email, value: customer.email, empty: t.noEmail },
    { label: t.phone, value: customer.phone, empty: t.noPhone },
    {
      label: t.company,
      value: hasCompany ? customer.companyName : null,
      empty: t.noCompany,
    },
  ]

  return (
    <Card title={t.customer}>
      <div className="odm-or-customer-name">
        {customer.fullName}
        {hasCompany ? (
          <span className="odm-or-pill odm-or-pill-blue">
            {t.customerBusiness}
          </span>
        ) : null}
      </div>
      <dl className="odm-or-kv">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd className={row.value ? undefined : 'is-empty'}>
              {row.value || row.empty}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
