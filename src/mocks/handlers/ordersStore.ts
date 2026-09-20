// Shared in-memory orders collection for the mock API. `managerOrders.ts`
// (P4) and `managerMissions.ts` (P5 — needs to read `order.status` to
// enforce the `ORDER_NOT_APPROVED` rule on `POST /orders/{id}/missions`)
// both need the *same* array: two independent
// `createCollection(ordersSeed.orders)` calls would silently diverge the
// moment one handler mutates `order.status` (P4's `approve()` did exactly
// this — see missionsStore.ts for the equivalent problem with missions).
import type { AiVerdict, OrderStatus } from '../../shared/types/domain'
import { createCollection } from '../db'
import ordersSeed from '../data/orders.json'

export type SeedOrder = {
  id: string
  code: string
  status: OrderStatus
  customer: {
    fullName: string
    companyName: string
    email: string | null
    phone: string | null
  }
  serviceName: string
  preferredDate: string
  preferredTimeName: string
  preferredWindow: string | null
  submittedAt: string
  addressText: string | null
  center: { lat: number; lon: number } | null
  radiusM: number | null
  nearestBase: string | null
  mediaRequirements: { label: string }[] | null
  purpose: string | null
  attachments:
    | {
        name: string
        sizeLabel: string
        mimeType: string
        url: string
      }[]
    | null
  aiVerdict: AiVerdict
  blockerCount: number
  warningCount: number
}

export const orders = createCollection(ordersSeed.orders) as SeedOrder[]

export function findOrder(id: string): SeedOrder | undefined {
  return orders.find((o) => o.id === id || o.code === id)
}
