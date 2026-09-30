import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { PageHeader, TableCard } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { customerHref } from '../../routes'
import { OrdersEmpty } from './components/OrdersEmpty'
import { OrdersPager } from './components/OrdersPager'
import { OrdersTable } from './components/OrdersTable'
import { OrdersToolbar } from './components/OrdersToolbar'
import { useOrdersList } from './hooks/useOrdersList'
import './Orders.css'
import { ordersPageMessages } from './OrdersPage.messages'

/** Customer order list backed by `GET /api/orders/mine`. */
export function OrdersPage() {
  const { t } = useI18n(ordersPageMessages)
  const list = useOrdersList()
  const { view } = list
  const showLoading = list.loading && !list.error

  return (
    <div className="ord-page">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <a className="odm-btn odm-btn-p" href={customerHref({ screen: 'createOrder' })}>
            {t.createOrder}
          </a>
        }
      />
      <OrdersToolbar
        status={list.status}
        query={list.query}
        onStatus={list.setStatus}
        onQuery={list.setQuery}
      />

      {showLoading && <LoadingState />}
      {!list.loading && list.error !== undefined && (
        <ErrorState title={t.errorTitle} error={list.error} onRetry={list.reload} />
      )}
      {!list.loading && list.error === undefined && view.totalItems === 0 && (
        <OrdersEmpty filtered={list.filtered} onClear={list.clear} />
      )}
      {!list.loading && list.error === undefined && view.totalItems > 0 && (
        <TableCard
          footer={
            <OrdersPager
              page={view.page}
              totalPages={view.totalPages}
              totalItems={view.totalItems}
              onPage={list.setPage}
            />
          }
        >
          <OrdersTable rows={view.items} />
        </TableCard>
      )}
    </div>
  )
}
