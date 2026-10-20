import { useState } from 'react'

import {
  StatusBadge,
  TableCard,
  toUiTone,
} from '../../../../../shared/components/ui'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import {
  getOrderStatusLabel,
  orderStatusTone,
} from '../../../../../shared/lib/statusTone'
import { localizeTimeslot } from '../../../../customer/lib/i18n/timeslots'
import { ordersApi } from '../../../api/ordersApi'
import { planningApi } from '../../../api/planningApi'
import { displayOrderCode } from '../../../../../shared/lib/orderCode'
import { managerHref } from '../../../routes'
import type { OrderCreateResponse } from '../../../types/orders'
import { allOrdersSectionMessages } from './AllOrdersSection.messages'

const ALL_FILTERS = [
  'ALL',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'NEEDS_INFO',
  'CLOSED',
] as const
type AllFilter = (typeof ALL_FILTERS)[number]

/** Every order, newest first, so an order never "disappears" once it leaves the review queue. */
export function AllOrdersSection() {
  const { t, lang, locale } = useI18n(allOrdersSectionMessages)
  const [filter, setFilter] = useState<AllFilter>('ALL')
  const query = useApiQuery(async (signal) => {
    const orders = await ordersApi.getManaged(undefined, signal)
    // An approved order stays APPROVED until its work is done; it is "in progress" once it has a live Mission.
    const started = new Set<string>()
    await Promise.all(
      orders
        .filter((order) => order.orderStatus === 'APPROVED')
        .map(async (order) => {
          try {
            const missions = await planningApi.getOrderMissions(
              order.id,
              signal,
            )
            if (missions.some((mission) => mission.status !== 'CANCELLED'))
              started.add(order.id)
          } catch {
            /* keep it under "Approved" */
          }
        }),
    )
    return { orders, started }
  }, [])
  const groupOf = (order: OrderCreateResponse) =>
    order.orderStatus === 'APPROVED' && query.data?.started.has(order.id)
      ? 'IN_PROGRESS'
      : order.orderStatus
  const rows = (query.data?.orders ?? []).filter((order) =>
    filter === 'ALL'
      ? true
      : filter === 'CLOSED'
        ? order.orderStatus === 'REJECTED' || order.orderStatus === 'CANCELLED'
        : groupOf(order) === filter,
  )

  return (
    <section aria-label={t.title}>
      <div className="mng-section-head">
        <div>
          <h2 className="mng-section-title">{t.title}</h2>
          <p className="mng-section-hint">{t.description}</p>
        </div>
      </div>
      <div className="mng-toolbar">
        <div className="mng-seg" role="group" aria-label={t.title}>
          {ALL_FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              className={`mng-seg-btn${filter === value ? ' is-active' : ''}`}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {t.filters[value]}
            </button>
          ))}
        </div>
      </div>
      {query.error ? (
        <p role="alert">{t.loadError}</p>
      ) : query.loading ? (
        <p role="status">{t.loading}</p>
      ) : rows.length === 0 ? (
        <p className="odm-or-empty">{t.empty}</p>
      ) : (
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
              {rows.map((row) => {
                const slot = localizeTimeslot(
                  { name: row.preferredTimeName },
                  lang,
                )
                const inProgress =
                  groupOf(row) === 'IN_PROGRESS' &&
                  row.orderStatus === 'APPROVED'
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="mng-cell-main odm-mono">
                        {displayOrderCode(row.orderCode, row.id)}
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
                      <StatusBadge
                        tone={toUiTone(orderStatusTone[row.orderStatus])}
                      >
                        {inProgress
                          ? t.filters.IN_PROGRESS
                          : getOrderStatusLabel(row.orderStatus, lang)}
                      </StatusBadge>
                    </td>
                    <td className="mng-actions">
                      <a
                        className="odm-btn odm-btn-sm"
                        href={managerHref({
                          screen: 'orderReview',
                          orderId: row.id,
                        })}
                      >
                        {t.view}
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableCard>
      )}
    </section>
  )
}
