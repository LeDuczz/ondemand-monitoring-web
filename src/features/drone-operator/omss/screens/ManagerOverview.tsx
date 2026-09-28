import { useI18n } from '../../../../shared/i18n'
import { managerOverviewMessages } from '../i18n/managerOverview'

const TEAM = [
  {
    id: 'OPR-112',
    name: 'J. Martinez',
    status: 'active',
    mission: 'MSN-9008 — In flight',
    since: '09:15',
  },
  {
    id: 'OPR-105',
    name: 'D. Okafor',
    status: 'available',
    mission: null,
    since: null,
  },
  {
    id: 'OPR-109',
    name: 'T. Nguyen',
    status: 'preflight',
    mission: 'MSN-9011 — Pre-flight',
    since: '13:55',
  },
  {
    id: 'OPR-114',
    name: 'A. Volkov',
    status: 'offline',
    mission: null,
    since: null,
  },
  {
    id: 'OPR-101',
    name: 'R. Santos',
    status: 'active',
    mission: 'MSN-9009 — In flight',
    since: '10:30',
  },
]

const TEAM_CFG: Record<string, { dot: string; color: string }> = {
  active: { dot: 'var(--green)', color: 'var(--green-text)' },
  available: { dot: 'var(--blue)', color: 'var(--blue-text)' },
  preflight: { dot: 'var(--amber)', color: 'var(--amber-text)' },
  offline: { dot: 'var(--text-3)', color: 'var(--text-3)' },
}

const APPROVALS = [
  {
    id: 'MSN-9011',
    operator: 'T. Nguyen (OPR-109)',
    drone: 'DR-ALPHA-3',
    submitted: '14:02',
    type: 'Control handover',
  },
  {
    id: 'MSN-9014',
    operator: 'L. Braun (OPR-117)',
    drone: 'DR-BETA-2',
    submitted: '13:48',
    type: 'Preflight override',
  },
]

const SCHEDULE = [
  {
    id: 'MSN-9008',
    title: 'Delivery — West Zone',
    operator: 'J. Martinez',
    time: '09:15',
    state: 'in_flight',
  },
  {
    id: 'MSN-9009',
    title: 'Survey — River corridor',
    operator: 'R. Santos',
    time: '10:30',
    state: 'in_flight',
  },
  {
    id: 'MSN-9011',
    title: 'Inspection — Section B',
    operator: 'T. Nguyen',
    time: '14:30',
    state: 'preflight',
  },
  {
    id: 'MSN-9012',
    title: 'Aerial survey — Zone 4',
    operator: 'Unassigned',
    time: '16:00',
    state: 'scheduled',
  },
  {
    id: 'MSN-9013',
    title: 'Delivery run — South Hub',
    operator: 'Unassigned',
    time: '17:15',
    state: 'scheduled',
  },
]

const STATE_CFG: Record<string, { dot: string; color: string }> = {
  in_flight: { dot: 'var(--green)', color: 'var(--green-text)' },
  preflight: { dot: 'var(--amber)', color: 'var(--amber-text)' },
  scheduled: { dot: 'var(--accent)', color: 'var(--accent)' },
}

export default function ManagerOverview() {
  const { t } = useI18n(managerOverviewMessages)
  const online = TEAM.filter((m) => m.status !== 'offline').length
  const active = TEAM.filter((m) => m.status === 'active').length

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <div style={{ maxWidth: 960 }}>
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 4px',
            }}
          >
            {t.title}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
            {t.managerLine}: S. Kim · MGR-007 · Wednesday, 9 September 2026
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 14,
            marginBottom: 24,
          }}
        >
          {[
            {
              label: t.stats.operatorsOnline,
              value: `${online}/${TEAM.length}`,
              color: online > 0 ? 'var(--green-text)' : 'var(--text)',
            },
            {
              label: t.stats.activeFlights,
              value: `${active}`,
              color: active > 0 ? 'var(--blue-text)' : 'var(--text)',
            },
            {
              label: t.stats.pendingApprovals,
              value: `${APPROVALS.length}`,
              color: APPROVALS.length > 0 ? 'var(--amber-text)' : 'var(--text)',
            },
            {
              label: t.stats.missionsToday,
              value: `${SCHEDULE.length}`,
              color: 'var(--text)',
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px 18px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-2)',
                  marginBottom: 6,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: 'var(--font-data)',
                  color: s.color,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Approvals alert */}
        {APPROVALS.length > 0 && (
          <div
            style={{
              background: 'var(--amber-bg)',
              border: '1px solid var(--amber-border)',
              borderRadius: 10,
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                padding: '11px 20px',
                borderBottom: '1px solid var(--amber-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--amber-text)',
                }}
              >
                {t.pendingApprovalsAction}
              </span>
            </div>
            {APPROVALS.map((a, i) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 20px',
                  borderBottom:
                    i < APPROVALS.length - 1
                      ? '1px solid var(--amber-border)'
                      : 'none',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--amber-text)',
                    }}
                  >
                    {a.type} · {a.id}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--amber-text)',
                      opacity: 0.75,
                      marginTop: 2,
                    }}
                  >
                    {a.operator} · {a.drone} · {t.submitted(a.submitted)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: '1px solid var(--amber-border)',
                      background: 'transparent',
                      color: 'var(--amber-text)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t.reject}
                  </button>
                  <button
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'var(--amber)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t.approve}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}
        >
          {/* Today's schedule */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              {t.missionScheduleToday}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    t.tableHeaders.time,
                    t.tableHeaders.mission,
                    t.tableHeaders.operator,
                    t.tableHeaders.status,
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '9px 16px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--text-2)',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--surface-2)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCHEDULE.map((s, i) => {
                  const cfg = STATE_CFG[s.state] ?? {
                    dot: 'var(--text-3)',
                    color: 'var(--text-3)',
                  }
                  const stateLabel =
                    t.scheduleState[s.state as keyof typeof t.scheduleState] ??
                    s.state
                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom:
                          i < SCHEDULE.length - 1
                            ? '1px solid var(--border)'
                            : 'none',
                      }}
                    >
                      <td
                        style={{
                          padding: '11px 16px',
                          fontSize: 13,
                          fontFamily: 'var(--font-data)',
                          fontWeight: 600,
                          color: 'var(--text)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.time}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <div
                          style={{
                            fontSize: 13,
                            color: 'var(--text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 220,
                          }}
                        >
                          {s.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            fontFamily: 'var(--font-data)',
                            color: 'var(--text-3)',
                            marginTop: 2,
                          }}
                        >
                          {s.id}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '11px 16px',
                          fontSize: 12,
                          color:
                            s.operator === 'Unassigned'
                              ? 'var(--red-text)'
                              : 'var(--text-2)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.operator === 'Unassigned'
                          ? t.unassigned
                          : s.operator}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            color: cfg.color,
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: cfg.dot,
                              display: 'inline-block',
                            }}
                          />
                          {stateLabel}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Team roster */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              {t.teamStatus}
            </div>
            {TEAM.map((m, i) => {
              const cfg = TEAM_CFG[m.status]
              const teamLabel =
                t.teamState[m.status as keyof typeof t.teamState] ?? m.status
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom:
                      i < TEAM.length - 1 ? '1px solid var(--border)' : 'none',
                    opacity: m.status === 'offline' ? 0.55 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-2)',
                      flexShrink: 0,
                    }}
                  >
                    {m.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--text)',
                      }}
                    >
                      {m.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-3)',
                        marginTop: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.mission ?? m.id}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 11,
                        color: cfg.color,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: cfg.dot,
                          display: 'inline-block',
                        }}
                      />
                      {teamLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
