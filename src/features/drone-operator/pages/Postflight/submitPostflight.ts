import { missionApi } from '../../../mission/api/missionApi'
import {
  flightControlApi,
  type FlightControlStatus,
} from '../../api/flightControlApi'
import type { PostflightItemKey } from '../../types/mission'
import {
  clearCompletedMissionState,
  type ResultsState,
} from './postflightHelpers'

export async function submitPostflight(args: {
  missionId: string
  missionLabel: string
  deviceId: string
  missionStatus: string | undefined
  results: ResultsState
  hasFailures: boolean
  notes: string
  telemetrySnapshot: FlightControlStatus | null
}): Promise<'MAINTENANCE' | 'AVAILABLE'> {
  const {
    missionId,
    missionLabel,
    deviceId,
    missionStatus,
    results,
    hasFailures,
    notes,
    telemetrySnapshot,
  } = args

  if (missionStatus === 'RETURNING') {
    await missionApi.startPostflight(missionId).catch(() => {
      // Proceed if already in postflight checking state
    })
  }

  const getResult = (key: PostflightItemKey): 'PASS' | 'FAIL' =>
    results[key] === 'ok' ? 'PASS' : 'FAIL'

  const inspectionResults: Record<string, 'PASS' | 'FAIL'> = {
    a1: getResult('physical_condition_ok'),
    a2: getResult('physical_condition_ok'),
    p1: getResult('motor_ok'),
    p2: getResult('motor_ok'),
    e1: getResult('battery_ok'),
    e4: getResult('battery_ok'),
    e2: getResult('camera_ok'),
    e3: getResult('gps_ok'),
    d1: getResult('communication_ok'),
  }

  const targetDroneStatus = hasFailures ? 'MAINTENANCE' : 'AVAILABLE'

  // Submit Postflight status to Backend
  // BE automatically creates MaintenanceTicket if targetDroneStatus is MAINTENANCE
  await missionApi.postFlightStatus(
    missionId,
    deviceId,
    targetDroneStatus,
    notes,
    inspectionResults,
    telemetrySnapshot,
  )

  await missionApi
    .disconnectGcs(missionId, 'POSTFLIGHT_COMPLETED')
    .catch(() => {
      // Postcheck is complete; local cleanup must still happen even if the session was already closed.
    })
  await flightControlApi.releaseSession(missionId).catch(() => {
    // Controller may be offline after landing; local cleanup still allows the operator flow to reset.
  })
  clearCompletedMissionState(missionId, missionLabel, deviceId)

  return targetDroneStatus
}
