import type { OrderDetail } from '../../../types/orders'
import '../../../components/common/planning.css'
import { OrderPlanningWorkspace } from './OrderPlanningWorkspace'

export function OrderMissionPlanningSection({
  orderId,
  initialOrder,
  onAssignResources,
}: {
  orderId: string
  initialOrder?: OrderDetail
  onAssignResources?: (missionId: string) => void
}) {
  return (
    <OrderPlanningWorkspace
      key={orderId}
      orderId={orderId}
      initialOrder={initialOrder}
      onAssignResources={onAssignResources}
    />
  )
}
