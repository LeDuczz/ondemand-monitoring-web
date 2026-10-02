import { useEffect, useState } from 'react'
import { missionApi } from '../../mission/api/missionApi'
import type { MissionStaffRole } from '../../mission/types/mission'

export type MissionSkippedSteps = {
  loaded: boolean
  /** No OPERATOR assigned → the pre-flight check step is skipped. */
  skipPreflight: boolean
  /** No MAINTAINER assigned → the post-flight check step is skipped. */
  skipPostflight: boolean
}

const NOT_LOADED: MissionSkippedSteps = {
  loaded: false,
  skipPreflight: false,
  skipPostflight: false,
}

/**
 * A role that is not assigned to the mission means its flow step is skipped.
 * Pilot is the only mandatory role, so it never causes a skip.
 */
export function useMissionSkippedSteps(missionId?: string | null): MissionSkippedSteps {
  const [state, setState] = useState<MissionSkippedSteps>(NOT_LOADED)

  useEffect(() => {
    if (!missionId) return
    let cancelled = false
    missionApi
      .getMissionById(missionId)
      .then((mission) => {
        if (cancelled) return
        const assigned = new Set<MissionStaffRole>(
          (mission.staffAssignments ?? [])
            .filter((item) => item.responseStatus !== 'REJECTED')
            .map((item) => item.assignedRole),
        )
        // Missions without any assignment data keep the full flow.
        const hasData = (mission.staffAssignments ?? []).length > 0
        setState({
          loaded: true,
          skipPreflight: hasData && !assigned.has('OPERATOR'),
          skipPostflight: hasData && !assigned.has('MAINTAINER'),
        })
      })
      .catch(() => {
        if (!cancelled) setState({ ...NOT_LOADED, loaded: true })
      })
    return () => {
      cancelled = true
    }
  }, [missionId])

  return state
}
