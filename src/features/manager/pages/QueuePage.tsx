import { useEffect, useState } from 'react'

import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { displayOrderCode } from '../../../shared/lib/orderCode'
import type { OrderCreateResponse } from '../types/orders'
import { ordersApi } from '../api/ordersApi'
import { localizeTimeslot } from '../lib/viLabels'
import { managerHref } from '../routes'
import { queuePageMessages } from './QueuePage.messages'
import { financeApi } from '../../finance/api'
import { planningApi } from '../api/planningApi'
import { orderStatusLabel, orderStatusTone } from '../../../shared/lib/statusTone'
import { StatusBadge, toUiTone } from '../../../shared/components/ui'
import '../manager.css'

export function QueuePage() {
  const { t, locale } = useI18n(queuePageMessages)
  const query = useApiQuery(async (signal) => {
    const [pending, approved] = await Promise.all([
      ordersApi.getQueue(signal),
      ordersApi.getApproved(signal),
    ])
    const paid = (await Promise.all(approved.map(async (order) => {
      try {
        const [invoice, missions] = await Promise.all([
          financeApi.getManagerInvoice(order.id, signal),
          planningApi.getOrderMissions(order.id, signal),
        ])
        const hasActiveMission = missions.some(
          (mission) => mission.status !== 'CANCELLED',
        )
        return invoice.paidAmount >= invoice.depositAmount && !hasActiveMission
          ? order
          : null
      } catch {
        return null
      }
    }))).filter((order): order is OrderCreateResponse => order !== null)
    return { pending, paid }
  }, [])

  useEffect(() => {
    const refresh = () => query.reload()
    window.addEventListener('focus', refresh)
    const interval = window.setInterval(refresh, 15_000)
    return () => {
      window.removeEventListener('focus', refresh)
      window.clearInterval(interval)
    }
  }, [query.reload])

  if (query.loading) return <QueueSkeleton />

  if (query.error) {
    return (
      <div className="odm-mgr-dash">
        <QueueHeader onRefresh={query.reload} t={t} />
        <StateView
          state="error"
          title={t.loadError}
          error={query.error}
          onRetry={query.reload}
        />
      </div>
    )
  }

  const data = query.data?.pending ?? []
  const paidOrders = query.data?.paid ?? []

  return (
    <div className="odm-mgr-dash">
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">{t.title}</h1>
          <div className="odm-mgr-dash-date">{t.summary(data.length, paidOrders.length)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            className="odm-btn odm-btn-p"
            href={managerHref({ screen: 'missions' })}
            style={{ textDecoration: 'none' }}
          >
            {t.viewMissions}
          </a>
          <button type="button" className="odm-btn" onClick={query.reload}>
            {t.refresh}
          </button>
        </div>
      </div>

      {paidOrders.length > 0 ? (
        <section className="odm-card odm-paid-orders" aria-label={t.paid.title}>
          <div className="odm-paid-orders-head">
            <div>
              <h2>{t.paid.title}</h2>
              <p>{t.paid.description}</p>
            </div>
            <span>{t.paid.count(paidOrders.length)}</span>
          </div>
          <div className="odm-mgr-queue-table-wrap">
            <table className="odm-table">
              <thead><tr><th>{t.columns.orderCode}</th><th>{t.columns.customer}</th><th>{t.columns.service}</th><th>{t.columns.preferredDate}</th><th>{t.paid.status}</th><th /></tr></thead>
              <tbody>{paidOrders.map((row) => (
                <tr key={row.id}>
                  <td><span className="odm-mono" style={{ fontWeight: 600 }}>{displayOrderCode(row.orderCode, row.id)}</span></td>
                  <td><div style={{ fontWeight: 600 }}>{row.customerName}</div></td>
                  <td>{row.serviceName}</td>
                  <td><span className="odm-tn">{new Date(row.preferredDateFrom).toLocaleDateString(locale)} · {localizeTimeslot(row.preferredTimeName)}</span></td>
                  <td><span className="odm-paid-badge">{t.paid.depositReceived}</span></td>
                  <td style={{ textAlign: 'right' }}><a className="odm-btn odm-btn-p odm-btn-sm" href={managerHref({ screen: 'orderReview', orderId: row.id })}>{t.paid.action}</a></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      ) : null}

      {data.length === 0 && paidOrders.length === 0 ? (
        <StateView
          state="empty"
          title={t.emptyTitle}
          description={t.emptyDescription}
          action={
            <a
              className="odm-btn odm-btn-p"
              href={managerHref({ screen: 'missions' })}
              style={{ textDecoration: 'none' }}
            >
              {t.viewMissions}
            </a>
          }
        />
      ) : data.length > 0 ? (
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
                      {new Date(row.preferredDateFrom).toLocaleDateString(
                        locale,
                      )}{' '}
                      · {localizeTimeslot(row.preferredTimeName)}
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
      ) : null}

      <AllOrdersSection />
    </div>
  )
}

function QueueHeader({
  onRefresh,
  t,
}: {
  onRefresh: () => void
  t: (typeof queuePageMessages)['vi']
}) {
  return (
    <div className="odm-mgr-dash-head">
      <div>
        <h1 className="odm-mgr-dash-title">{t.title}</h1>
      </div>
      <button type="button" className="odm-btn" onClick={onRefresh}>
        {t.refresh}
      </button>
    </div>
  )
}

function QueueSkeleton() {
  const { t } = useI18n(queuePageMessages)
  return (
    <div className="odm-mgr-dash" aria-busy="true" aria-live="polite">
      <div className="odm-mgr-dash-head">
        <span className="odm-sk" style={{ width: 220, height: 24 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <span
            key={i}
            className="odm-sk"
            style={{ width: 90, height: 28, borderRadius: 14 }}
          />
        ))}
      </div>
      <div
        className="odm-card"
        style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className="odm-sk"
            style={{ width: '100%', height: 42 }}
          />
        ))}
      </div>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}

const ALL_FILTERS = ['ALL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_INFO', 'CLOSED'] as const

/** Every order, newest first, so an order never "disappears" once it leaves the review queue. */
function AllOrdersSection() {
  const { t, locale } = useI18n(queuePageMessages)
  const [filter, setFilter] = useState<(typeof ALL_FILTERS)[number]>('ALL')
  const query = useApiQuery(async (signal) => {
    const orders = await ordersApi.getManaged(undefined, signal)
    // An approved order stays APPROVED until its work is done; it is "in progress" once it has a live Mission.
    const started = new Set<string>()
    await Promise.all(
      orders
        .filter((order) => order.orderStatus === 'APPROVED')
        .map(async (order) => {
          try {
            const missions = await planningApi.getOrderMissions(order.id, signal)
            if (missions.some((mission) => mission.status !== 'CANCELLED'))
              started.add(order.id)
          } catch {
            /* keep it under "Đã duyệt" */
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
    <section className="odm-card odm-all-orders" aria-label={t.all.title}>
      <div className="odm-paid-orders-head">
        <div>
          <h2>{t.all.title}</h2>
          <p>{t.all.description}</p>
        </div>
      </div>
      <div className="odm-or-filters" role="group" aria-label={t.all.title}>
        {ALL_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            className={`odm-or-filter${filter === value ? ' is-active' : ''}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {t.all.filters[value]}
          </button>
        ))}
      </div>
      {query.error ? (
        <p role="alert">{t.all.loadError}</p>
      ) : query.loading ? (
        <p role="status">{t.loading}</p>
      ) : rows.length === 0 ? (
        <p className="odm-or-empty">{t.all.empty}</p>
      ) : (
        <div className="odm-mgr-queue-table-wrap">
          <table className="odm-table">
            <thead>
              <tr>
                <th>{t.columns.orderCode}</th>
                <th>{t.columns.customer}</th>
                <th>{t.columns.service}</th>
                <th>{t.columns.preferredDate}</th>
                <th>{t.all.status}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="odm-mono" style={{ fontWeight: 600 }}>
                      {displayOrderCode(row.orderCode, row.id)}
                    </span>
                  </td>
                  <td>{row.customerName}</td>
                  <td>{row.serviceName}</td>
                  <td>
                    <span className="odm-tn">
                      {new Date(row.preferredDateFrom).toLocaleDateString(locale)}
                      {' · '}
                      {localizeTimeslot(row.preferredTimeName)}
                    </span>
                  </td>
                  <td>
                    <StatusBadge tone={toUiTone(orderStatusTone[row.orderStatus] ?? 'gray')}>
                      {groupOf(row) === 'IN_PROGRESS' && row.orderStatus === 'APPROVED'
                        ? t.all.filters.IN_PROGRESS
                        : (orderStatusLabel[row.orderStatus] ?? row.orderStatus)}
                    </StatusBadge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <a
                      className="odm-btn odm-btn-sm"
                      href={managerHref({ screen: 'orderReview', orderId: row.id })}
                    >
                      {t.all.view}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
