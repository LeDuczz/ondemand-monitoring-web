import { SIMULATION_MAP_DEFAULT_CROP } from '../../../../shared/lib/simulationMapProjection'
import type { AvailableOperator } from '../../../staff/api/operatorApi'
import type { MissionStaffRole } from '../../../mission/types/mission'

export const missionRoles: MissionStaffRole[] = [
  'PILOT',
  'OPERATOR',
  'MAINTAINER',
  'INSPECTOR',
]

export const SIMULATION_MAP_TOP_IMAGE =
  '/simulation-viewer/simulation_map_top.png'
export const SIMULATION_MAP_VERSION = '20260925113000'
export const SIMULATION_MAP_BOUNDS = {
  minX: -417.15933531249993,
  maxX: 415.15933531249993,
  minY: -414.65578218749977,
  maxY: 417.66288843749993,
}
export const SIMULATION_MAP_IMAGE_CROP = SIMULATION_MAP_DEFAULT_CROP

export type DispatchStep = 'order' | 'mission' | 'staff' | 'device' | 'confirm'
export const dispatchSteps: DispatchStep[] = [
  'order',
  'mission',
  'staff',
  'device',
  'confirm',
]

export function fmtDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

export function fmtDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function preferredTimeLabel(value?: string | null) {
  const key = value?.trim().toUpperCase()
  if (!key) return ''
  const labels: Record<string, string> = {
    MORNING: 'Buổi sáng',
    AFTERNOON: 'Buổi chiều',
    EVENING: 'Buổi tối',
    NIGHT: 'Buổi đêm',
  }
  return labels[key] ?? value?.trim() ?? ''
}

export function missionStatusLabel(
  status: string,
  labels: Record<string, string>,
) {
  return labels[status] ?? status
}

export function requestedWindow(current: {
  orderPreferredDateFrom?: string | null
  orderPreferredDateTo?: string | null
  orderPreferredTimeName?: string | null
}) {
  const from = fmtDate(current.orderPreferredDateFrom)
  const to = fmtDate(current.orderPreferredDateTo)
  const dateText = from === to ? from : `${from} → ${to}`
  const timeLabel = preferredTimeLabel(current.orderPreferredTimeName)
  return timeLabel ? `${dateText} · ${timeLabel}` : dateText
}

export function fmtRadius(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${Number.isInteger(value) ? value : value.toFixed(1)} m`
}

export function staffInitials(staff: AvailableOperator) {
  const source = staff.fullName || staff.email || '?'
  const parts = source.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2)
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}
