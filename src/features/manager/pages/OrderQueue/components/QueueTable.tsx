import type { OrderCreateResponse } from '../../../types/orders'
import { displayOrderCode } from '../../../../../shared/lib/orderCode'
import { localizeTimeslot } from '../../../lib/viLabels'
import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { queueTableMessages } from './QueueTable.messages'

export function QueueTable({ data }: { data: OrderCreateResponse[] }) {
  const { t, locale } = useI18n(queueTableMessages)
  return (
    <div className="odm-card odm-mgr-queue-table-wrap">
      <table className="odm-table">
        <thead>
          <tr>
            <th>{t.columns.orderCode}</th>
            <th>{t.columns.customer}</th>
            <th>{t.columns.service}</th>
            <th>{t.columns.preferredDate}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.map((row: OrderCreateResponse) => (
            <tr key={row.id}>
              <td>
                <span className="odm-mono" style={{ fontWeight: 600 }}>
                  {displayOrderCode(row.orderCode, row.id)}
                </span>
              </td>
              <td>
                <div style={{ fontWeight: 600 }}>{row.customerName}</div>
              </td>
              <td>{row.serviceName}</td>
              <td>
                <span className="odm-tn">
                  {new Date(row.preferredDateFrom).toLocaleDateString(locale)} ·{' '}
                  {localizeTimeslot(row.preferredTimeName)}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <a
                  className="odm-btn odm-btn-p odm-btn-sm"
                  href={managerHref({
                    screen: 'orderReview',
                    orderId: row.id,
                  })}
                >
                  {t.review}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
