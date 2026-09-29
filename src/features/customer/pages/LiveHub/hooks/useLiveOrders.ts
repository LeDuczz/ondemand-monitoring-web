import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerApi } from '../../../api/customerApi'
import { toOrderRow } from '../../../lib/orders/mapOrder'
import { sortNewestFirst } from '../../../lib/orders/filterOrders'

/**
 * The BE has no live-session endpoint. An order the customer has in progress
 * is the closest signal, so the hub lists `GET /api/orders/mine?status=IN_PROGRESS`.
 */
export function useLiveOrders() {
  return useApiQuery(
    (signal) =>
      customerApi
        .listMyOrders({ status: 'IN_PROGRESS', signal })
        .then((rows) => sortNewestFirst(rows.map(toOrderRow))),
    [],
  )
}
