import { StatusBadge, TableCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { localizeTimeslot } from '../../../../customer/lib/i18n/timeslots'
import { formatOrderCode } from '../../../components/common/format'
import { managerHref } from '../../../routes'
import type { OrderCreateResponse } from '../../../types/orders'
import { paidOrdersTableMessages } from './PaidOrdersTable.messages'

/** Approved orders whose deposit is paid and that still need Missions. */
export function PaidOrdersTable({ data }: { data: OrderCreateResponse[] }) {
  const { t, lang, locale } = useI18n(paidOrdersTableMessages)
  return (
    <section aria-label={t.title}>
      <div className="mng-section-head">
        <div>
          <h2 className="mng-section-title">{t.title}</h2>
          <p className="mng-section-hint">{t.description}</p>
        </div>
        <StatusBadge tone="success">{t.count(data.length)}</StatusBadge>
      </div>
      <TableCard>
        <table className="mng-table">
          <thead>
            <tr>
              <th>{t.columns.order}</th>
              <th>{t.columns.service}</th>
              <th>{t.columns.schedule}</th>
              <th>{t.columns.status}</th>
              <th>
                <span className="mng-sr-only">{t.columns.actions}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const slot = localizeTimeslot(
                { name: row.preferredTimeName },
                lang,
              )
              return (
                <tr key={row.id}>
                  <td>
                    <div className="mng-cell-main odm-mono">
                      {formatOrderCode(row.orderCode ?? row.id)}
                    </div>
                    <div className="mng-cell-sub">{row.customerName}</div>
                  </td>
                  <td>{row.serviceName}</td>
                  <td className="mng-nowrap">
                    <span className="odm-tn">
                      {new Date(row.preferredDateFrom).toLocaleDateString(
                        locale,
                      )}
                      {slot ? ` · ${slot}` : ''}
                    </span>
                  </td>
                  <td>
                    <StatusBadge tone="success">
                      {t.depositReceived}
                    </StatusBadge>
                  </td>
                  <td className="mng-actions">
                    <a
                      className="odm-btn odm-btn-p odm-btn-sm"
                      href={managerHref({
                        screen: 'orderReview',
                        orderId: row.id,
                      })}
                    >
                      {t.action}
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableCard>
    </section>
  )
}
