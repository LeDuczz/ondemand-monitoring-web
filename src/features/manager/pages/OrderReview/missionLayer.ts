import type { Language } from '../../../../shared/i18n'
import { getMissionStatusLabel } from '../../../../shared/lib/statusTone'
import { missionProgress } from '../../components/common/workflowModel'
import type { PlanningWorkflowInfo } from './planningWorkspaceData'

/** Mission row of the workflow header: which Mission, its business status, and where it is. */
export function missionLayer(
  planning: PlanningWorkflowInfo | null,
  missionId: string | null,
  lang: Language,
  stage?: 'resources' | 'review',
) {
  const total = planning?.missions.length
  const index = planning?.missions.findIndex((m) => m.id === missionId) ?? -1
  const mission = index >= 0 ? planning?.missions[index] : undefined
  const progress = mission ? missionProgress(mission.status) : null
  return {
    progress:
      stage === 'resources'
        ? { current: 'resources' as const, finished: false, terminal: null }
        : stage === 'review'
          ? { current: 'prepare' as const, finished: false, terminal: null }
          : progress,
    index: mission ? index + 1 : undefined,
    total: mission ? total : undefined,
    code: mission?.code,
    statusLabel: mission
      ? getMissionStatusLabel(mission.status, lang)
      : undefined,
  }
}
