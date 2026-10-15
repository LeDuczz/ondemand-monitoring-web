import { missionHasSafeStop } from '../../../mission/lib/missionOperationalState'
import type { OperatorMission } from '../../types/mission'

/** Pilot has not answered yet: the screen's job is to support Accept/Reject. */
export function isAwaitingResponse(mission: OperatorMission): boolean {
  return (
    mission.status === 'PENDING' &&
    mission.myResponseStatus !== 'ACCEPTED' &&
    !missionHasSafeStop(mission)
  )
}
