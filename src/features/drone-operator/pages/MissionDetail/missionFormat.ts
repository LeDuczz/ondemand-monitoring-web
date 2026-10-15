import type { RuntimeOverallStatus, WeatherCheckStatus } from './types'

export function formatHm(iso: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(iso)
  return m ? `${m[1]}:${m[2]}` : ''
}

export function dash(value?: string | number | null): string {
  if (value == null || value === '') return '—'
  return String(value)
}

export function formatCoord(value?: number | null): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(6)
    : '—'
}

export function statusTone(status?: RuntimeOverallStatus | WeatherCheckStatus) {
  if (status === 'READY' || status === 'PASS') return 'green'
  if (status === 'FAILED' || status === 'FAIL') return 'red'
  if (status === 'WARN') return 'yellow'
  return 'gray'
}

export function formatNumber(value?: number | null, suffix = '', decimals = 1) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${value.toFixed(decimals)}${suffix}`
}
