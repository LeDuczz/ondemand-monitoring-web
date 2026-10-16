// Mock handlers for MNG-09. Endpoints:
//   PATCH  /api/drones/{id}/status               [ĐỀ XUẤT]
import type { DroneStatus } from '../../shared/types/domain'
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import dronesSeed from '../data/drones.json'

type SeedDroneModel = {
  id: string
  modelCode: string
  manufacturer: string
  category: string
  maxFlightTimeMinutes: number
  maxTakeoffWeightKg: number
  maxFlightAltitudeMeters: number
  maxWindResistanceMetersPerSecond: number
  ipRating: string
  specsMetadata: string
  createdAt: string
  updatedAt: string
  version: number
}

type SeedDronePayload = {
  id: string
  modelName: string
  sensorType: string
  weightKg: number
  payloadCapabilities: string
  createdAt: string
  updatedAt: string
  version: number
}

type SeedDrone = {
  id: string
  code: string
  name: string | null
  serialNumber: string | null
  droneModelName: string | null
  status: string
  baseStation: string | null
  batteryPct: number | null
  hoursSinceMaintenance: number | null
  payload: string | null
  lastSeenAt: string | null
  distanceKmToNhaBe?: number | null
  enduranceMarginPct?: number | null
  hasThermalSensor?: boolean | null
  existingBookings?: {
    missionCode: string
    start: string | null
    end: string | null
  }[]
  openTicketSeverity?: string
  // P6 additions — BE `DroneResponse` fields, kept alongside the
  // pre-existing MNG-09 display fields above (see
  // features/manager/types/drones.ts `DroneResponse`).
  droneModel?: SeedDroneModel
  dronePayload?: SeedDronePayload
  createdAt?: string
  updatedAt?: string
  version?: number
}

const drones = createCollection(dronesSeed.items) as SeedDrone[]

// P6: `GET /api/drones/{id}` [BE] — maps straight to the BE `DroneResponse`
// DTO shape rather than the MNG-09 display-only `DroneItem` shape.
function toDroneResponse(d: SeedDrone) {
  return {
    id: d.id,
    serialNumber: d.serialNumber ?? '',
    droneModel: d.droneModel ?? null,
    dronePayload: d.dronePayload ?? null,
    status: d.status,
    createdAt: d.createdAt ?? '',
    updatedAt: d.updatedAt ?? '',
    version: d.version ?? 1,
  }
}

// Valid status transitions [ĐỀ XUẤT per MNG-09 design context]
const VALID_TRANSITIONS: Partial<Record<DroneStatus, DroneStatus[]>> = {
  AVAILABLE: ['MAINTENANCE', 'RESERVED', 'OFFLINE'],
  MAINTENANCE: ['AVAILABLE', 'OUT_OF_SERVICE'],
  RESERVED: ['AVAILABLE', 'IN_MISSION'],
  IN_MISSION: ['RETURNING'],
  RETURNING: ['AVAILABLE', 'MAINTENANCE'],
  OUT_OF_SERVICE: ['MAINTENANCE'],
  OFFLINE: ['AVAILABLE'],
}

registerMockRoutes([
  // ── MNG-09: patch drone status [ĐỀ XUẤT — kept for backward compat] ──
  {
    method: 'PATCH',
    path: '/api/drones/:id/status',
    handler: ({ params, body }) => {
      const drone = drones.find(
        (d) => d.id === params.id || d.code === params.id,
      )
      if (!drone) return fail(404, 'NOT_FOUND', 'Không tìm thấy drone')

      const req = (body ?? {}) as { status?: DroneStatus; reason?: string }
      if (!req.reason?.trim()) {
        return fail(400, 'VALIDATION_ERROR', 'Lý do là bắt buộc', {
          reason: 'Bắt buộc',
        })
      }

      const validNext = VALID_TRANSITIONS[drone.status as DroneStatus] ?? []
      if (!req.status || !validNext.includes(req.status)) {
        return fail(
          422,
          'INVALID_TRANSITION',
          `Không thể chuyển từ ${drone.status} sang ${req.status ?? '(trống)'}`,
        )
      }

      drone.status = req.status
      return ok(toDroneResponse(drone), 'Đã cập nhật trạng thái drone')
    },
  },
])

/** Test-only escape hatch */
export const __testing = { drones }
