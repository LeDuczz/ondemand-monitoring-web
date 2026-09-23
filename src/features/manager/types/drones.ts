import type { DroneStatus } from '../../../shared/types/domain'

export type DroneItem = {
  id: string
  code: string
  name: string | null
  serialNumber: string | null
  droneModelName: string | null
  status: DroneStatus
  baseStation: string | null
  batteryPct: number | null
  hoursSinceMaintenance: number | null
  payload: string | null
  lastSeenAt: string | null
}
