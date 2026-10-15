import type { ReactNode } from 'react'

import type { AvailableDrone } from '../../../staff/api/droneApi'
import type { AvailableOperator } from '../../../staff/api/operatorApi'
import type { MissionStaffRole } from '../../../mission/types/mission'

export type OrderDispatchContext = {
  orderId: string
  missionScoped: boolean
  returnLabel: string
  initialStep: 'staff' | 'device' | 'confirm'
  canAssign: boolean
  missionSelection: ReactNode
  onMissionNext: () => boolean
  onReturn: (toOrigin?: boolean) => void
  onAssigned: () => void
  onChanged: () => void
  onDraftState: (dirty: boolean, busy: boolean) => void
  initialDevices: string[]
  initialStaff: Partial<Record<MissionStaffRole, string[]>>
  assignedPeople: AvailableOperator[]
  assignedDevices: AvailableDrone[]
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
}
