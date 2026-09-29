import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerApi } from '../../../api/customerApi'
import { toOrderRow } from '../../../lib/orders/mapOrder'

/** The order being watched: `GET /api/orders/{id}` (there is no live stream API yet). */
export function useLiveOrder(orderId: string) {
  return useApiQuery(
    (signal) => customerApi.getOrderById(orderId, signal).then(toOrderRow),
    [orderId],
  )
}
