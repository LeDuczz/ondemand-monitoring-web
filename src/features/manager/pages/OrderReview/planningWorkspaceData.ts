import type { Invoice } from '../../../finance/types'
import type { MissionStatus } from '../../../../shared/types/domain'
import type { MissionResponse } from '../../types/missions'
import type { OrderDetail } from '../../types/orders'
import type { ExecutionPlan } from '../../types/planning'

/** Everything the planning workspace loads in one go. */
export type PlanningWorkspaceData = {
  plan: ExecutionPlan
  missions: MissionResponse[]
  order: OrderDetail
  /** Null until the customer accepted the quote and an invoice exists. */
  invoice: Invoice | null
}

/** What the page header needs to draw the Order/Mission workflow honestly. */
export type PlanningWorkflowInfo = {
  depositPaid: boolean
  selectedMissionId: string | null
  missions: Array<{ id: string; code: string; status: MissionStatus }>
}
