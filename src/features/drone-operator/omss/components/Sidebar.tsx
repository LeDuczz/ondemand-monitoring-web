import React from 'react'
import type { NavId, Screen, Role } from '../types'

interface Props {
  role: Role
  active: NavId
  onChange: (id: NavId, screen?: Screen) => void
  alerts: number
}
interface NavItem {
  id: NavId
  label: string
  screen?: Screen
  icon: React.ReactNode
}

const OPERATOR_NAV: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    screen: 'operator-overview',
    icon: <GridIcon />,
  },
  {
    id: 'my-missions',
    label: 'Mission của tôi',
    screen: 'mission-list',
    icon: <ListIcon />,
  },
  {
    id: 'availability',
    label: 'Lịch rảnh',
    screen: 'availability',
    icon: <CalendarIcon />,
  },
  {
    id: 'mission-control',
    label: 'Mission control',
    screen: 'in-flight',
    icon: <RadioIcon />,
  },
  { id: 'media', label: 'Media', screen: 'media-upload', icon: <MediaIcon /> },
  {
    id: 'zone-map',
    label: 'Zone map',
    screen: 'simulation-zones',
    icon: <MapIcon />,
  },
]
const CUSTOMER_NAV: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    screen: 'customer-overview',
    icon: <GridIcon />,
  },
  { id: 'my-requests', label: 'My requests', icon: <ListIcon /> },
  { id: 'media-downloads', label: 'Media downloads', icon: <MediaIcon /> },
  { id: 'billing', label: 'Billing', icon: <BillingIcon /> },
  { id: 'support', label: 'Support', icon: <SupportIcon /> },
]
const MANAGER_NAV: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    screen: 'manager-overview',
    icon: <GridIcon />,
  },
  { id: 'team', label: 'Team', icon: <TeamIcon /> },
  { id: 'approvals', label: 'Approvals', icon: <CheckIcon /> },
  { id: 'fleet', label: 'Fleet', icon: <FleetIcon /> },
  { id: 'reports', label: 'Reports', icon: <ChartIcon /> },
]
const SYSOP_NAV: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    screen: 'sysop-overview',
    icon: <GridIcon />,
  },
  { id: 'fleet-health', label: 'Fleet health', icon: <FleetIcon /> },
  { id: 'maintenance', label: 'Maintenance', icon: <WrenchIcon /> },
  { id: 'systems', label: 'Systems', icon: <ServerIcon /> },
  { id: 'sys-alerts', label: 'Alerts', icon: <BellIcon /> },
]
const ADMIN_NAV: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    screen: 'admin-overview',
    icon: <GridIcon />,
  },
  { id: 'users', label: 'Users', icon: <TeamIcon /> },
  { id: 'configuration', label: 'Configuration', icon: <SettingsIcon /> },
  { id: 'audit', label: 'Audit log', icon: <HistoryIcon /> },
  { id: 'integrations', label: 'Integrations', icon: <ServerIcon /> },
]

const WORKSPACE: NavItem[] = [
  { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
  { id: 'profile', label: 'Profile', icon: <UserIcon /> },
]

const ROLE_NAV: Record<Role, NavItem[]> = {
  operator: OPERATOR_NAV,
  customer: CUSTOMER_NAV,
  manager: MANAGER_NAV,
  sysop: SYSOP_NAV,
  admin: ADMIN_NAV,
}

const ROLE_META: Record<
  Role,
  { title: string; profile: string; initials: string; id: string }
> = {
  operator: {
    title: 'Operator Workspace',
    profile: 'J. Martinez',
    initials: 'JM',
    id: 'Drone Operator · OPR-112',
  },
  customer: {
    title: 'Client Portal',
    profile: 'A. Chen',
    initials: 'AC',
    id: 'Premium Client · ACC-4421',
  },
  manager: {
    title: 'Operations Console',
    profile: 'S. Kim',
    initials: 'SK',
    id: 'Operations Manager · MGR-007',
  },
  sysop: {
    title: 'System Console',
    profile: 'R. Patel',
    initials: 'RP',
    id: 'System Admin · SYS-003',
  },
  admin: {
    title: 'Administration',
    profile: 'L. Torres',
    initials: 'LT',
    id: 'Platform Admin · ADM-001',
  },
}

function NavRow({
  item,
  active,
  onChange,
  badge,
}: {
  item: NavItem
  active: boolean
  onChange: Props['onChange']
  badge?: number
}) {
  return (
    <button
      onClick={() => onChange(item.id, item.screen)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 12px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        background: active ? 'var(--accent-bg)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-2)',
        fontFamily: 'var(--font-ui)',
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        transition: 'background .1s, color .1s',
      }}
    >
      <span
        style={{
          color: active ? 'var(--accent)' : 'var(--text-3)',
          display: 'flex',
          flexShrink: 0,
        }}
      >
        {item.icon}
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {badge ? (
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'var(--red)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  )
}

export default function Sidebar({ role, active, onChange, alerts }: Props) {
  const nav = ROLE_NAV[role] ?? ROLE_NAV['operator']
  const meta = ROLE_META[role] ?? ROLE_META['operator']

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2L16 7v9H2V7L9 2z"
                stroke="#fff"
                strokeWidth="1.5"
                fill="none"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="10" r="2" fill="#fff" opacity=".85" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text)',
                lineHeight: 1.2,
              }}
            >
              OMSS
            </div>
            <div
              style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.3 }}
            >
              {meta.title}
            </div>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--accent-bg)',
            border: '2px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}
          >
            {meta.initials}
          </span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text)',
              lineHeight: 1.3,
            }}
          >
            {meta.profile}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {meta.id}
          </div>
        </div>
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--green)',
            flexShrink: 0,
            marginLeft: 'auto',
          }}
        />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-3)',
            padding: '4px 12px 6px',
            letterSpacing: '.04em',
            textTransform: 'uppercase',
          }}
        >
          Navigation
        </div>
        {nav.map((item) => (
          <NavRow
            key={item.id}
            item={item}
            active={active === item.id}
            onChange={onChange}
          />
        ))}

        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-3)',
            padding: '14px 12px 6px',
            letterSpacing: '.04em',
            textTransform: 'uppercase',
          }}
        >
          Workspace
        </div>
        {WORKSPACE.map((item) => (
          <NavRow
            key={item.id}
            item={item}
            active={active === item.id}
            onChange={onChange}
            badge={item.id === 'notifications' ? alerts : undefined}
          />
        ))}
      </nav>

      {/* System status */}
      <div
        style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-3)',
            marginBottom: 8,
          }}
        >
          System status
        </div>
        {[
          { label: 'GCS connection', ok: true },
          { label: 'Server', ok: true },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 5,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
              {s.label}
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                color: s.ok ? 'var(--green)' : 'var(--red)',
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: s.ok ? 'var(--green)' : 'var(--red)',
                  display: 'inline-block',
                }}
              />
              {s.ok ? 'Online' : 'Offline'}
            </span>
          </div>
        ))}
      </div>
    </aside>
  )
}

function GridIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" />
      <rect x="9.5" y="1" width="5.5" height="5.5" rx="1" />
      <rect x="1" y="9.5" width="5.5" height="5.5" rx="1" />
      <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" />
    </svg>
  )
}
function ListIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <line x1="5" y1="4" x2="14" y2="4" />
      <line x1="5" y1="8" x2="14" y2="8" />
      <line x1="5" y1="12" x2="14" y2="12" />
      <circle cx="2" cy="4" r=".8" fill="currentColor" stroke="none" />
      <circle cx="2" cy="8" r=".8" fill="currentColor" stroke="none" />
      <circle cx="2" cy="12" r=".8" fill="currentColor" stroke="none" />
    </svg>
  )
}
function RadioIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8" r="2" />
      <path d="M4 4a5.66 5.66 0 0 0 0 8" />
      <path d="M12 4a5.66 5.66 0 0 1 0 8" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" />
      <rect
        x="1"
        y="1"
        width="14"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  )
}
function MediaIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="3" width="14" height="11" rx="1.5" />
      <circle cx="5.5" cy="7.5" r="1.5" />
      <path d="M9.5 9.5l2-2 3 3" />
    </svg>
  )
}
function HistoryIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M8 4v4l2.5 2.5" />
      <path d="M2 8a6 6 0 1 0 1.5-3.9" />
      <path d="M2 4v4h4" />
    </svg>
  )
}
function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M8 1a5 5 0 0 1 5 5v3l1.5 2H1.5L3 9V6a5 5 0 0 1 5-5z" />
      <path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
    </svg>
  )
}
function UserIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="5" r="3" />
      <path d="M1 14c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </svg>
  )
}
function TeamIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 13c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <circle cx="12" cy="5" r="2" />
      <path d="M14 13c0-2.2-1.6-4-3.5-4.5" />
    </svg>
  )
}
function BillingIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="3" width="14" height="11" rx="1.5" />
      <line x1="1" y1="7" x2="15" y2="7" />
    </svg>
  )
}
function SupportIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8" r="7" />
      <path d="M8 10v1" />
      <path d="M8 6a2 2 0 1 1 2 2c-.6.4-2 1-2 2" />
    </svg>
  )
}
function FleetIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M8 2l2 4H6L8 2z" />
      <circle cx="8" cy="9" r="3" />
      <line x1="8" y1="12" x2="8" y2="14" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polyline points="2,12 6,7 10,9 14,4" />
    </svg>
  )
}
function WrenchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2a3 3 0 0 0-3 3c0 .4.1.8.2 1.1L3 12a1 1 0 0 0 0 1.4l.6.6a1 1 0 0 0 1.4 0l6.2-6.2c.3.1.7.2 1.1.2a3 3 0 0 0 0-6z" />
    </svg>
  )
}
function ServerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="2" width="14" height="5" rx="1" />
      <rect x="1" y="9" width="14" height="5" rx="1" />
      <circle cx="4" cy="4.5" r=".8" fill="currentColor" stroke="none" />
      <circle cx="4" cy="11.5" r=".8" fill="currentColor" stroke="none" />
    </svg>
  )
}
function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
    </svg>
  )
}
function MapIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M1.5 4.5l4-2 5 2 4-2v9l-4 2-5-2-4 2v-9z" />
      <path d="M5.5 2.5v9M10.5 4.5v9" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="2" width="14" height="13" rx="1.5" />
      <line x1="1" y1="6" x2="15" y2="6" />
      <line x1="5" y1="1" x2="5" y2="4" />
      <line x1="11" y1="1" x2="11" y2="4" />
      <circle cx="5" cy="9.5" r=".8" fill="currentColor" stroke="none" />
      <circle cx="8" cy="9.5" r=".8" fill="currentColor" stroke="none" />
      <circle cx="11" cy="9.5" r=".8" fill="currentColor" stroke="none" />
    </svg>
  )
}
