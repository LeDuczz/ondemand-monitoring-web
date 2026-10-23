import { Button, StatusBadge, TableCard, toUiTone } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { displayOrderCode } from '../../../../../shared/lib/orderCode'
import {
  orderStatusLabel,
  orderStatusLabelEn,
  orderStatusTone,
} from '../../../../../shared/lib/statusTone'
import { formatOrderAge } from '../../../lib/actionItemAge'
import { localizeTimeslot } from '../../../lib/viLabels'
import { managerHref } from '../../../routes'
import type { OrderCreateResponse } from '../../../types/orders'
import { orderQueuePageMessages } from '../OrderQueuePage.messages'

export type QueueTableMode = 'pending' | 'ready' | 'all'

type Props = {
  rows: OrderCreateResponse[]
  total: number
  mode: QueueTableMode
  /** True when an APPROVED order already has a live mission. */
  isInProgress?: (order: OrderCreateResponse) => boolean
}

export function QueueTable({ rows, total, mode, isInProgress }: Props) {
  const { t, locale, lang } = useI18n(orderQueuePageMessages)
  const now = new Date()
  const labels = lang === 'en' ? orderStatusLabelEn : orderStatusLabel
  const actionLabel = mode === 'pending' ? t.review : mode === 'ready' ? t.plan : t.view
  return (
    <TableCard footer={t.resultCount(rows.length, total)}>
      <table className="mgr-table">
        <thead>
          <tr>
            <th>{t.columns.order}</th>
            <th>{t.columns.service}</th>
            <th>{t.columns.preferred}</th>
            <th>{t.columns.waiting}</th>
            <th>{t.columns.status}</th>
            <th className="is-right">{t.columns.action}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const running = row.orderStatus === 'APPROVED' && isInProgress?.(row)
            return (
              <tr key={row.id}>
                <td>
                  <div className="mgr-cell-main">{displayOrderCode(row.orderCode, row.id)}</div>
                  <div className="mgr-cell-sub">{row.customerName}</div>
                </td>
                <td>{row.serviceName}</td>
                <td className="mgr-nowrap">
                  <div>{new Date(row.preferredDateFrom).toLocaleDateString(locale)}</div>
                  <div className="mgr-cell-sub">{localizeTimeslot(row.preferredTimeName)}</div>
                </td>
                <td className="mgr-nowrap mgr-muted">{formatOrderAge(now, row.createdAt, 24, lang)}</td>
                <td>
                  {mode === 'ready' ? (
                    <StatusBadge tone="success">{t.depositReceived}</StatusBadge>
                  ) : (
                    <StatusBadge tone={toUiTone(orderStatusTone[row.orderStatus] ?? 'gray')}>
                      {running ? t.filters.IN_PROGRESS : (labels[row.orderStatus] ?? row.orderStatus)}
                    </StatusBadge>
                  )}
                </td>
                <td className="is-right">
                  <Button
                    size="sm"
                    variant={mode === 'all' ? 'secondary' : 'primary'}
                    href={managerHref({ screen: 'orderReview', orderId: row.id })}
                  >
                    {actionLabel}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </TableCard>
  )
}
