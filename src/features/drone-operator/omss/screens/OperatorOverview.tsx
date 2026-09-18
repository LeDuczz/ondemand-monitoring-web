import type { Mission, Drone } from '../types'
import { ALL_MISSIONS, DRONE_PRIMARY } from '../mockData'

interface Props {
  onGoMissions: () => void
  onGoMission: (m: Mission) => void
}

const STATS = [
  { label: "Today's missions", value: '3', sub: '1 active, 2 upcoming' },
  { label: 'Hours flown this week', value: '11.4', sub: '↑ 2.1 vs last week' },
  { label: 'Flight hours this month', value: '47.2', sub: 'Target: 60 h' },
  { label: 'Missions completed', value: '128', sub: 'Lifetime total' },
]

const UPCOMING: {
  id: string
  title: string
  time: string
  loc: string
  priority: string
}[] = [
  {
    id: 'MSN-9011',
    title: 'Infrastructure inspection — Section B',
    time: '14:30',
    loc: 'Riverside District',
    priority: 'HIGH',
  },
  {
    id: 'MSN-9012',
    title: 'Aerial survey — Zone 4',
    time: '16:00',
    loc: 'North Industrial Park',
    priority: 'NORMAL',
  },
]

const RECENT: {
  id: string
  title: string
  date: string
  result: 'completed' | 'failed' | 'cancelled'
}[] = [
  {
    id: 'MSN-9008',
    title: 'Delivery run — West Zone',
    date: 'Today 09:15',
    result: 'completed',
  },
  {
    id: 'MSN-9006',
    title: 'Inspection — Power grid',
    date: 'Yesterday 14:50',
    result: 'completed',
  },
  {
    id: 'MSN-9003',
    title: 'Survey — East corridor',
    date: '7 Sep 11:00',
    result: 'failed',
  },
  {
    id: 'MSN-8997',
    title: 'Delivery — Downtown Hub',
    date: '6 Sep 10:30',
    result: 'completed',
  },
]

const RESULT_CFG = {
  completed: {
    color: 'var(--green-text)',
    dot: 'var(--green)',
    label: 'Completed',
  },
  failed: { color: 'var(--red-text)', dot: 'var(--red)', label: 'Failed' },
  cancelled: {
    color: 'var(--text-3)',
    dot: 'var(--text-3)',
    label: 'Cancelled',
  },
}

export default function OperatorOverview({ onGoMissions, onGoMission }: Props) {
  const activeMission = ALL_MISSIONS.find(
    (m) => m.state === 'WAITING_OPERATOR_ACCEPTANCE',
  )
  const drone: Drone = DRONE_PRIMARY

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <div style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 4px',
            }}
          >
            Good afternoon, J. Martinez
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
            Wednesday, 9 September 2026 · Operator ID: OPR-112
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
          {STATS.map((s) => (
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
                  fontSize: 26,
                  fontWeight: 700,
                  fontFamily: 'var(--font-data)',
                  color: 'var(--text)',
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}
        >
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Active / pending alert */}
            {activeMission && (
              <div
                style={{
                  background: 'var(--amber-bg)',
                  border: '1px solid var(--amber-border)',
                  borderRadius: 10,
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--amber-text)',
                      marginBottom: 3,
                    }}
                  >
                    Mission awaiting your acceptance
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--amber-text)',
                      opacity: 0.8,
                    }}
                  >
                    {activeMission.id} · {activeMission.title}
                  </div>
                </div>
                <button
                  onClick={() => onGoMission(activeMission)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--amber)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    marginLeft: 16,
                  }}
                >
                  Review now
                </button>
              </div>
            )}

            {/* Upcoming missions */}
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
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text)',
                  }}
                >
                  Upcoming today
                </span>
                <button
                  onClick={onGoMissions}
                  style={{
                    fontSize: 12,
                    color: 'var(--accent)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  View all missions
                </button>
              </div>
              {UPCOMING.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 20px',
                    borderBottom:
                      i < UPCOMING.length - 1
                        ? '1px solid var(--border)'
                        : 'none',
                  }}
                >
                  <div
                    style={{ width: 42, textAlign: 'center', flexShrink: 0 }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'var(--font-data)',
                        color: 'var(--text)',
                      }}
                    >
                      {m.time}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      today
                    </div>
                  </div>
                  <div
                    style={{
                      width: 1,
                      height: 32,
                      background: 'var(--border)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-2)',
                        marginTop: 2,
                      }}
                    >
                      {m.loc}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color:
                          m.priority === 'HIGH'
                            ? 'var(--amber-text)'
                            : 'var(--text-3)',
                        background:
                          m.priority === 'HIGH'
                            ? 'var(--amber-bg)'
                            : 'var(--surface-2)',
                        border: `1px solid ${m.priority === 'HIGH' ? 'var(--amber-border)' : 'var(--border)'}`,
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {m.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent activity */}
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
                Recent missions
              </div>
              {RECENT.map((m, i) => {
                const cfg = RESULT_CFG[m.result]
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '11px 20px',
                      borderBottom:
                        i < RECENT.length - 1
                          ? '1px solid var(--border)'
                          : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: cfg.dot,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-3)',
                          marginTop: 2,
                        }}
                      >
                        {m.date}
                      </div>
                    </div>
                    <span
                      style={{ fontSize: 12, color: cfg.color, flexShrink: 0 }}
                    >
                      {cfg.label}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-data)',
                        color: 'var(--text-3)',
                        flexShrink: 0,
                      }}
                    >
                      {m.id}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right column — drone assignment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                Assigned drone
              </div>
              <div style={{ padding: '16px' }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: 2,
                  }}
                >
                  {drone.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-2)',
                    marginBottom: 14,
                  }}
                >
                  {drone.model} · {drone.id}
                </div>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  {[
                    {
                      label: 'Battery',
                      value: `${drone.battery}%`,
                      bar: true,
                      pct: drone.battery,
                      color:
                        drone.battery > 50 ? 'var(--green)' : 'var(--amber)',
                    },
                    {
                      label: 'GPS satellites',
                      value: `${drone.gpsCount} sats`,
                    },
                    {
                      label: 'Storage',
                      value: `${(drone.storageMB / 1024).toFixed(1)} GB free`,
                    },
                    { label: 'Signal (RSSI)', value: `${drone.rssi}%` },
                  ].map((r) => (
                    <div key={r.label}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: r.bar ? 4 : 0,
                        }}
                      >
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                          {r.label}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontFamily: 'var(--font-data)',
                            fontWeight: 600,
                            color: 'var(--text)',
                          }}
                        >
                          {r.value}
                        </span>
                      </div>
                      {r.bar && (
                        <div
                          style={{
                            height: 4,
                            background: 'var(--border)',
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${r.pct}%`,
                              height: '100%',
                              background: r.color,
                              borderRadius: 2,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'var(--green-bg)',
                    border: '1px solid var(--green-border)',
                    fontSize: 12,
                    color: 'var(--green-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: 'var(--green)',
                      flexShrink: 0,
                    }}
                  />
                  Available — ready for assignment
                </div>
              </div>
            </div>

            {/* Quick links */}
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
                Quick actions
              </div>
              {[{ label: 'View all missions', action: onGoMissions }].map(
                (q, i) => (
                  <button
                    key={i}
                    onClick={q.action}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: 'var(--text)',
                      textAlign: 'left',
                    }}
                  >
                    {q.label}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M5 2l5 5-5 5" />
                    </svg>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
