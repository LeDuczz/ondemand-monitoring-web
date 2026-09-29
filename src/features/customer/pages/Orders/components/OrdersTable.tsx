import { useI18n } from '../../../../../shared/i18n'
import { OrderStatusBadge } from '../../../components/common/OrderStatusBadge'
import { formatDateRange } from '../../../lib/orders/format'
import type { OrderRow } from '../../../lib/orders/types'
import { useTimeslotLabel } from '../../../hooks/usePreferredTimes'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { customerHref } from '../../../routes'
import { ordersTableMessages } from './OrdersTable.messages'

const DASH = '—'

export function OrdersTable({ rows }: { rows: OrderRow[] }) {
  const { t, locale, lang } = useI18n(ordersTableMessages)
  const timeLabel = useTimeslotLabel()
  const c = t.columns

  return (
    <table className="ord-table">
      <thead>
        <tr>
          <th>{c.order}</th>
          <th>{c.location}</th>
          <th>{c.schedule}</th>
          <th>{c.service}</th>
          <th>{c.status}</th>
          <th>{c.actions}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const href = customerHref({ screen: 'orderDetail', orderId: row.id })
          return (
            <tr key={row.id}>
              <td>
                <a className="ord-title" href={href}>
                  {row.title}
                </a>
                <div className="ord-code">{row.code}</div>
              </td>
              <td className="ord-muted">{row.address ?? DASH}</td>
              <td className="ord-nowrap">
                {formatDateRange(row.dateFrom, row.dateTo, locale) ?? DASH}
                {row.timeName || row.timeId ? (
                  <div className="ord-muted">
                    {timeLabel({ id: row.timeId, name: row.timeName })}
                  </div>
                ) : null}
              </td>
              <td>
                {row.serviceName
                  ? localizeServiceName(row.serviceId ?? row.serviceName, lang, row.serviceName)
                  : DASH}
              </td>
              <td>
                <OrderStatusBadge status={row.status} />
              </td>
              <td>
                <a className="ord-link" href={href}>
                  {t.view}
                </a>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
