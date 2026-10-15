import type { AvailableOperator } from '../../../../staff/api/operatorApi'
import { staffInitials } from '../liveDispatchHelpers'

export function StaffAvatar({ staff }: { staff: AvailableOperator }) {
  return (
    <span aria-hidden="true" className="odm-dp-avatar">
      {staffInitials(staff)}
    </span>
  )
}
