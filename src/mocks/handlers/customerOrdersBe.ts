// Mock handler in the BE DTO shape for the customer's own orders. Verified
// against /v3/api-docs:
//   GET /api/orders/mine ?status (PENDING|APPROVED|REJECTED|IN_PROGRESS|COMPLETED|CANCELLED)
//                        -> ApiResponse<OrderCreateResponse[]> (no paging)
// `GET /api/orders/{id}` is served by managerOrders.ts, which falls back to
// `findBeOrder` for the customer's orders. This module must be imported
// BEFORE managerOrders so `mine` is not swallowed by `GET /api/orders/:id`.
import { fail, ok, registerMockRoutes } from '../mockServer'
import { BE_ORDER_STATUSES, listBeOrders } from './customerOrdersStore'

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/orders/mine',
    handler: ({ query }) => {
      const status = query.get('status')
      if (status && !(BE_ORDER_STATUSES as readonly string[]).includes(status)) {
        return fail(400, 'VALIDATION_ERROR', 'Invalid status', {
          status: `status must be one of ${BE_ORDER_STATUSES.join(', ')}`,
        })
      }
      const rows = listBeOrders().filter((o) => !status || o.orderStatus === status)
      return ok(rows)
    },
  },
])
