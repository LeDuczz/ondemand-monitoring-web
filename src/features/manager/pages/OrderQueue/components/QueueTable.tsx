import {
  EmptyState,
  StatusBadge,
  TableCard,
  toUiTone,
} from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { formatOrderCode } from '../../../components/common/format'
import {
  getOrderStatusLabel,
  orderStatusTone,
} from '../../../../../shared/lib/statusTone'
import { formatWaitLabel, isOverdue } from '../../../lib/queue'
import { localizeTimeslot } from '../../../../customer/lib/i18n/timeslots'
import { managerHref } from '../../../routes'
import type { OrderCreateResponse } from '../../../types/orders'
import { queueTableMessages } from './QueueTable.messages'

export function QueueTable({
  data,
  now,
  emptyTitle,
  emptyDescription,
}: {
  data: OrderCreateResponse[]
  now: Date
  emptyTitle: string
  emptyDescription: string
}) {
  const { t, lang, locale } = useI18n(queueTableMessages)
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }
  return (
    <TableCard>
      <table className="mng-table">
        <thead>
          <tr>
            <th>{t.columns.order}</th>
            <th>{t.columns.service}</th>
            <th>{t.columns.schedule}</th>
            <th>{t.columns.age}</th>
            <th>{t.columns.status}</th>
            <th>
              <span className="mng-sr-only">{t.columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const slot = localizeTimeslot({ name: row.preferredTimeName }, lang)
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
                    {new Date(row.preferredDateFrom).toLocaleDateString(locale)}
                    {slot ? ` · ${slot}` : ''}
                  </span>
                </td>
                <td className="mng-nowrap">
                  <StatusBadge
                    tone={isOverdue(now, row) ? 'danger' : 'neutral'}
                  >
                    {formatWaitLabel(now, row, lang)}
                  </StatusBadge>
                </td>
                <td>
                  <StatusBadge
                    tone={toUiTone(orderStatusTone[row.orderStatus])}
                  >
                    {getOrderStatusLabel(row.orderStatus, lang)}
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
                    {t.review}
                  </a>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </TableCard>
  )
}
