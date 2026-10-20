import { useEffect, useMemo, useState } from 'react'

import { StateView } from '../../../../shared/components/odm/StateView'
import { Card, PageHeader } from '../../../../shared/components/ui'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { financeApi } from '../../../finance/api'
import { ordersApi } from '../../api/ordersApi'
import { planningApi } from '../../api/planningApi'
import type { OrderCreateResponse } from '../../types/orders'
import { managerHref } from '../../routes'
import { orderQueuePageMessages } from './OrderQueuePage.messages'
import '../../manager.css'
import { AllOrdersSection } from './components/AllOrdersSection'
import { PaidOrdersTable } from './components/PaidOrdersTable'
import { QueueEmptyState } from './components/QueueEmptyState'
import { QueueSkeleton } from './components/QueueSkeleton'
import { QueueStats } from './components/QueueStats'
import { QueueTable } from './components/QueueTable'
import { QueueToolbar } from './components/QueueToolbar'
import { matchesQueueFilter, type QueueFilter } from './queueHelpers'

export function OrderQueuePage() {
  const { t } = useI18n(orderQueuePageMessages)
  const query = useApiQuery(async (signal) => {
    const [pending, approved] = await Promise.all([
      ordersApi.getQueue(signal),
      ordersApi.getApproved(signal),
    ])
    // Approved + deposit paid + no live Mission yet = ready for planning.
    const paid = (
      await Promise.all(
        approved.map(async (order) => {
          try {
            const [invoice, missions] = await Promise.all([
              financeApi.getManagerInvoice(order.id, signal),
              planningApi.getOrderMissions(order.id, signal),
            ])
            const hasActiveMission = missions.some(
              (mission) => mission.status !== 'CANCELLED',
            )
            return invoice.paidAmount >= invoice.depositAmount &&
              !hasActiveMission
              ? order
              : null
          } catch {
            return null
          }
        }),
      )
    ).filter((order): order is OrderCreateResponse => order !== null)
    return { pending, paid }
  }, [])
  const [filter, setFilter] = useState<QueueFilter>('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const refresh = () => query.reload()
    window.addEventListener('focus', refresh)
    const interval = window.setInterval(refresh, 15_000)
    return () => {
      window.removeEventListener('focus', refresh)
      window.clearInterval(interval)
    }
  }, [query.reload])

  const data = useMemo(() => query.data?.pending ?? [], [query.data])
  const paidOrders = useMemo(() => query.data?.paid ?? [], [query.data])
  // Re-evaluated whenever the list reloads (every 15s / on focus).
  const now = useMemo(() => new Date(), [query.data])
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return data.filter((row) => {
      if (!matchesQueueFilter(row, filter, now)) return false
      if (!needle) return true
      return [row.orderCode, row.id, row.customerName, row.serviceName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [data, filter, search, now])

  const actions = (
    <>
      <a
        className="odm-btn"
        href={managerHref({ screen: 'missions' })}
        style={{ textDecoration: 'none' }}
      >
        {t.viewMissions}
      </a>
      <button type="button" className="odm-btn" onClick={query.reload}>
        {t.refresh}
      </button>
    </>
  )

  if (query.loading) return <QueueSkeleton />

  if (query.error) {
    return (
      <div className="odm-or">
        <PageHeader title={t.title} actions={actions} />
        <Card>
          <StateView
            state="error"
            title={t.loadError}
            error={query.error}
            onRetry={query.reload}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="odm-or">
      <PageHeader
        title={t.title}
        subtitle={t.summary(data.length, paidOrders.length)}
        actions={actions}
      />

      {paidOrders.length > 0 ? <PaidOrdersTable data={paidOrders} /> : null}

      {data.length === 0 && paidOrders.length === 0 ? (
        <QueueEmptyState />
      ) : data.length > 0 ? (
        <>
          <QueueStats data={data} now={now} />
          <QueueToolbar
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
          />
          <QueueTable
            data={visible}
            now={now}
            emptyTitle={t.noMatchTitle}
            emptyDescription={t.noMatchDescription}
          />
        </>
      ) : null}

      <AllOrdersSection />
    </div>
  )
}
