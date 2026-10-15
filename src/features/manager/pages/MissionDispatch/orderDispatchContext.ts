import type { ReactNode } from 'react'

import type { AvailableDrone } from '../../../staff/api/droneApi'
import type { AvailableOperator } from '../../../staff/api/operatorApi'
import type { MissionStaffRole } from '../../../mission/types/mission'

export type OrderDispatchContext = {
  orderId: string
  /** Rendered inside the Order review page, which already owns the header and stepper. */
  embeddedInOrderReview?: boolean
  missionScoped: boolean
  returnLabel: string
  initialStep: 'staff' | 'device' | 'confirm'
  canAssign: boolean
  missionSelection: ReactNode
  onMissionNext: () => boolean
  onReturn: (toOrigin?: boolean) => void
  onAssigned: () => void
  /** Reports the order workflow step (6 = resources, 7 = confirm). */
  onGlobalStep?: (step: 6 | 7) => void
  onChanged: () => void
  onDraftState: (dirty: boolean, busy: boolean) => void
  initialDevices: string[]
  initialStaff: Partial<Record<MissionStaffRole, string[]>>
  assignedPeople: AvailableOperator[]
  assignedDevices: AvailableDrone[]
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
}
