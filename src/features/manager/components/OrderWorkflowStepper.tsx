import {
  MISSION_STAGES,
  type MissionProgress,
  type OrderProgress,
} from './workflow/workflowModel'
import { WorkflowStepper, type WorkflowMissionLayer } from './workflow/WorkflowStepper'

/**
 * Legacy page positions: 5 = planning, 6/7 = assigning resources to a Mission
 * (staff, device, confirm), 8 = preparation overview, 9 = flight permit.
 */
export type OrderWorkflowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * Mission-level screens sit under an Order whose own stages are finished (or,
 * while planning, in progress). The Mission row has its own context and is
 * never numbered as a continuation of the Order row.
 */
export function OrderWorkflowStepper({
  currentStep,
  mission,
}: {
  currentStep: OrderWorkflowStep
  mission?: Omit<WorkflowMissionLayer, 'progress'>
}) {
  const orderProgress: OrderProgress =
    currentStep <= 5
      ? { current: 'planning', waiting: false, terminal: null }
      : { current: 'complete', waiting: false, terminal: null }
  const missionProgress: MissionProgress | null =
    currentStep <= 5
      ? null
      : {
          current:
            currentStep >= 9
              ? MISSION_STAGES[2]
              : currentStep >= 8
                ? MISSION_STAGES[1]
                : MISSION_STAGES[0],
          finished: false,
          terminal: null,
        }
  return (
    <WorkflowStepper
      order={{ progress: orderProgress }}
      mission={
        currentStep <= 5 && !mission
          ? undefined
          : { ...mission, progress: missionProgress }
      }
    />
  )
}
