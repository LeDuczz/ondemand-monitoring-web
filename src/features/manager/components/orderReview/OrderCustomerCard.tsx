import type { OrderDetail } from '../../types/orders'
import type { OrderReviewMessages } from '../../pages/OrderReviewPage.messages'
import { OrderIcon, type OrderIconName } from './OrderIcon'

function initialsOf(fullName: string): string {
  const letters = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return letters || '?'
}

export function OrderCustomerCard({
  order,
  t,
}: {
  order: OrderDetail
  t: OrderReviewMessages
}) {
  const { customer } = order
  const hasCompany = Boolean(customer.companyName?.trim())
  const rows: Array<{
    icon: OrderIconName
    value: string | null
    empty: string
  }> = [
    { icon: 'mail', value: customer.email, empty: t.noEmail },
    { icon: 'phone', value: customer.phone, empty: t.noPhone },
    {
      icon: 'building',
      value: hasCompany ? customer.companyName : null,
      empty: t.noCompany,
    },
  ]

  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="user" size={18} />
          {t.customer}
        </span>
      </header>
      <div className="odm-or-card-body">
        <div className="odm-or-customer">
          <span className="odm-or-avatar" aria-hidden="true">
            {initialsOf(customer.fullName)}
          </span>
          <div className="odm-or-customer-main">
            <div className="odm-or-customer-name">{customer.fullName}</div>
            {hasCompany ? (
              <span className="odm-or-pill odm-or-pill-blue">
                {t.customerBusiness}
              </span>
            ) : null}
          </div>
        </div>
        <ul className="odm-or-contact">
          {rows.map((row) => (
            <li
              key={row.icon}
              className={row.value ? undefined : 'is-empty'}
            >
              <OrderIcon name={row.icon} size={16} />
              <span>{row.value || row.empty}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
