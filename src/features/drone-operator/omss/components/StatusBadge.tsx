import type { MissionState, DroneState, CheckStatus } from '../types'

/* ── Status dot helper ─────────────────────────────────────── */
function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  )
}

/* ── Mission status ────────────────────────────────────────── */
const MISSION_CFG: Record<
  MissionState,
  { label: string; color: string; dot: string }
> = {
  WAITING_OPERATOR_ACCEPTANCE: {
    label: 'Awaiting acceptance',
    color: 'var(--amber)',
    dot: 'var(--amber)',
  },
  RESOURCE_ASSIGNING: {
    label: 'Assigning resources',
    color: 'var(--blue)',
    dot: 'var(--blue)',
  },
  SCHEDULED: { label: 'Scheduled', color: 'var(--blue)', dot: 'var(--blue)' },
  CONNECTED: { label: 'Connected', color: 'var(--green)', dot: 'var(--green)' },
  PREFLIGHT_CHECKING: {
    label: 'Pre-flight check',
    color: 'var(--blue)',
    dot: 'var(--blue)',
  },
  READY_TO_FLY: {
    label: 'Ready to fly',
    color: 'var(--green)',
    dot: 'var(--green)',
  },
  FAILED_PREFLIGHT: {
    label: 'Pre-flight failed',
    color: 'var(--red)',
    dot: 'var(--red)',
  },
  PENDING_APPROVAL: {
    label: 'Pending approval',
    color: 'var(--amber)',
    dot: 'var(--amber)',
  },
  IN_FLIGHT: { label: 'In flight', color: 'var(--green)', dot: 'var(--green)' },
  RETURNING: { label: 'Returning', color: 'var(--blue)', dot: 'var(--blue)' },
  POSTFLIGHT_CHECKING: {
    label: 'Post-flight check',
    color: 'var(--blue)',
    dot: 'var(--blue)',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'var(--green-text)',
    dot: 'var(--green)',
  },
  FAILED: { label: 'Failed', color: 'var(--red-text)', dot: 'var(--red)' },
  CANCELLED: {
    label: 'Cancelled',
    color: 'var(--text-3)',
    dot: 'var(--text-3)',
  },
}

export function MissionBadge({ state }: { state: MissionState }) {
  const c = MISSION_CFG[state]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        color: c.color,
      }}
    >
      <Dot color={c.dot} />
      {c.label}
    </span>
  )
}

/* ── Drone status ──────────────────────────────────────────── */
const DRONE_CFG: Record<
  DroneState,
  { label: string; color: string; dot: string }
> = {
  AVAILABLE: { label: 'Available', color: 'var(--green)', dot: 'var(--green)' },
  PREFLIGHT: { label: 'Pre-flight', color: 'var(--blue)', dot: 'var(--blue)' },
  ACTIVE_MISSION: {
    label: 'Active mission',
    color: 'var(--green)',
    dot: 'var(--green)',
  },
  IDLE_CHARGING: {
    label: 'Charging',
    color: 'var(--amber)',
    dot: 'var(--amber)',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    color: 'var(--red-text)',
    dot: 'var(--red)',
  },
}

export function DroneBadge({ state }: { state: DroneState }) {
  const c = DRONE_CFG[state]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        color: c.color,
      }}
    >
      <Dot color={c.dot} />
      {c.label}
    </span>
  )
}

/* ── Check status ──────────────────────────────────────────── */
const CHECK_CFG: Record<
  CheckStatus,
  { label: string; color: string; icon: string }
> = {
  PASS: { label: 'Passed', color: 'var(--green)', icon: '✓' },
  FAIL: { label: 'Failed', color: 'var(--red-text)', icon: '✕' },
  WARNING: { label: 'Warning', color: 'var(--amber)', icon: '⚠' },
  PENDING: { label: 'Pending', color: 'var(--text-3)', icon: '—' },
}

export function CheckBadge({ status }: { status: CheckStatus }) {
  const c = CHECK_CFG[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 13,
        fontWeight: 500,
        color: c.color,
      }}
    >
      <span>{c.icon}</span>
      {c.label}
    </span>
  )
}

/* ── Priority ──────────────────────────────────────────────── */
const PRI_CFG = {
  CRITICAL: {
    label: 'Critical',
    color: 'var(--red-text)',
    bg: 'var(--red-bg)',
  },
  HIGH: { label: 'High', color: 'var(--amber-text)', bg: 'var(--amber-bg)' },
  NORMAL: { label: 'Normal', color: 'var(--text-2)', bg: 'var(--surface-2)' },
  LOW: { label: 'Low', color: 'var(--text-3)', bg: 'var(--surface-2)' },
}

export function PriorityBadge({
  priority,
}: {
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
}) {
  const c = PRI_CFG[priority]
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: c.color,
        padding: '2px 7px',
        borderRadius: 4,
        background: c.bg,
      }}
    >
      {c.label}
    </span>
  )
}
