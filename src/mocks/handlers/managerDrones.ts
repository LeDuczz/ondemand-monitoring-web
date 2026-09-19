// Mock handlers for MNG-09. Endpoints:
//   GET    /api/drones?status=&page=&pageSize=    [BE DroneController]
//   PATCH  /api/drones/{id}/status               [ĐỀ XUẤT]
import type { DroneStatus } from '../../shared/types/domain'
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import dronesSeed from '../data/drones.json'

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
}

const drones = createCollection(dronesSeed.drones) as SeedDrone[]

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

function toDroneItem(d: SeedDrone) {
  return {
    id: d.id,
    code: d.code,
    name: d.name ?? null,
    serialNumber: d.serialNumber ?? null,
    droneModelName: d.droneModelName ?? null,
    status: d.status,
    baseStation: d.baseStation ?? null,
    batteryPct: d.batteryPct ?? null,
    hoursSinceMaintenance: d.hoursSinceMaintenance ?? null,
    payload: d.payload ?? null,
    lastSeenAt: d.lastSeenAt ?? null,
  }
}

registerMockRoutes([
  // ── MNG-09: list drones [BE DroneController] ───────────────────────────
  {
    method: 'GET',
    path: '/api/drones',
    handler: ({ query }) => {
      const statusFilter = query.get('status')
      const page = Math.max(1, parseInt(query.get('page') ?? '1', 10))
      const pageSize = Math.max(1, parseInt(query.get('pageSize') ?? '20', 10))

      const filtered = statusFilter
        ? drones.filter((d) => d.status === statusFilter)
        : drones

      const total = filtered.length
      const start = (page - 1) * pageSize
      const items = filtered.slice(start, start + pageSize).map(toDroneItem)

      return ok({ items, total, page, pageSize })
    },
  },

  // ── MNG-09: patch drone status [ĐỀ XUẤT] ──────────────────────────────
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
      return ok(toDroneItem(drone), 'Đã cập nhật trạng thái drone')
    },
  },
])

/** Test-only escape hatch */
export const __testing = { drones }
