import type { OrderDetail } from '../../../types/orders'
import '../../../components/common/planning.css'
import { OrderPlanningWorkspace } from './OrderPlanningWorkspace'
import type { PlanningWorkflowInfo } from '../planningWorkspaceData'

export type { PlanningWorkflowInfo }

export function OrderMissionPlanningSection({
  orderId,
  initialOrder,
  onAssignResources,
  onWorkflowInfo,
}: {
  orderId: string
  initialOrder?: OrderDetail
  onAssignResources?: (missionId: string) => void
  onWorkflowInfo?: (info: PlanningWorkflowInfo) => void
}) {
  return (
    <OrderPlanningWorkspace
      key={orderId}
      orderId={orderId}
      initialOrder={initialOrder}
      onAssignResources={onAssignResources}
      onWorkflowInfo={onWorkflowInfo}
    />
  )
}
