import type { OrderStatus } from '../../../shared/types/domain'

/** Order row for the support ticket dialog, mapped from `GET /api/orders/mine`. */
export type CustomerOrderItem = {
  id: string
  orderCode: string
  title: string
  addressText: string | null
  preferredDate: string
  preferredTimeLabel: string | null
  radiusM: number | null
  status: OrderStatus
  serviceNames: string[]
  missionCount: number
  hasNewMedia: boolean
  submittedAt: string | null
  canCancel: boolean
}
