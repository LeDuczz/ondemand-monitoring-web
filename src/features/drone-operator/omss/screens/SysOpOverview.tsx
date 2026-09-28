import { useI18n } from '../../../../shared/i18n'
import { getDroneStatusLabel } from '../../../../shared/lib/statusTone'
import type { DroneStatus } from '../../../../shared/types/domain'
import { sysOpOverviewMessages } from '../i18n/sysOpOverview'

const FLEET = [
  {
    id: 'DR-ALPHA-1',
    model: 'DJI M300',
    battery: 82,
    state: 'ACTIVE_MISSION',
    gcs: true,
    lastSeen: '0s ago',
    alerts: 0,
  },
  {
    id: 'DR-ALPHA-2',
    model: 'DJI M300',
    battery: 96,
    state: 'AVAILABLE',
    gcs: true,
    lastSeen: '2m ago',
    alerts: 0,
  },
  {
    id: 'DR-ALPHA-3',
    model: 'DJI M300',
    battery: 44,
    state: 'PREFLIGHT',
    gcs: true,
    lastSeen: '0s ago',
    alerts: 1,
  },
  {
    id: 'DR-BETA-1',
    model: 'Autel EVO',
    battery: 12,
    state: 'IDLE_CHARGING',
    gcs: false,
    lastSeen: '1h ago',
    alerts: 0,
  },
  {
    id: 'DR-BETA-2',
    model: 'Autel EVO',
    battery: 78,
    state: 'PREFLIGHT',
    gcs: true,
    lastSeen: '0s ago',
    alerts: 0,
  },
  {
    id: 'DR-GAMMA-1',
    model: 'Skydio X2',
    battery: 5,
    state: 'MAINTENANCE',
    gcs: false,
    lastSeen: '3d ago',
    alerts: 2,
  },
  {
    id: 'DR-GAMMA-2',
    model: 'Skydio X2',
    battery: 88,
    state: 'AVAILABLE',
    gcs: true,
    lastSeen: '4m ago',
    alerts: 0,
  },
  {
    id: 'DR-GAMMA-3',
    model: 'Skydio X2',
    battery: 61,
    state: 'ACTIVE_MISSION',
    gcs: true,
    lastSeen: '0s ago',
    alerts: 0,
  },
]

const ALERTS_LIST = [
  {
    id: 'ALT-441',
    sev: 'critical',
    msg: 'DR-GAMMA-1 battery critically low — maintenance hold',
    time: '08:14',
  },
  {
    id: 'ALT-440',
    sev: 'warning',
    msg: 'DR-ALPHA-3 telemetry latency > 800ms',
    time: '13:57',
  },
  {
    id: 'ALT-438',
    sev: 'warning',
    msg: 'GCS-STATION-2 signal degraded — 65% RSSI',
    time: '11:30',
  },
  {
    id: 'ALT-434',
    sev: 'info',
    msg: 'DR-BETA-1 charging cycle complete',
    time: 'Yesterday',
  },
]

const GCS_STATIONS = [
  {
    id: 'GCS-01',
    location: 'Base Station Alpha',
    connected: 2,
    status: 'operational',
    uptime: '14d 6h',
  },
  {
    id: 'GCS-02',
    location: 'Base Station Beta',
    connected: 1,
    status: 'degraded',
    uptime: '7d 2h',
  },
  {
    id: 'GCS-03',
    location: 'Mobile Unit 1',
    connected: 0,
    status: 'offline',
    uptime: '—',
  },
]

const STATE_COLOR: Record<string, string> = {
  ACTIVE_MISSION: 'var(--green)',
  AVAILABLE: 'var(--blue)',
  PREFLIGHT: 'var(--amber)',
  IDLE_CHARGING: 'var(--text-3)',
  MAINTENANCE: 'var(--red)',
}

const SEV_CFG: Record<
  string,
  { bg: string; border: string; color: string; dot: string }
> = {
  critical: {
    bg: 'var(--red-bg)',
    border: 'var(--red-border)',
    color: 'var(--red-text)',
    dot: 'var(--red)',
  },
  warning: {
    bg: 'var(--amber-bg)',
    border: 'var(--amber-border)',
    color: 'var(--amber-text)',
    dot: 'var(--amber)',
  },
  info: {
    bg: 'var(--blue-bg)',
    border: 'var(--blue-border)',
    color: 'var(--blue-text)',
    dot: 'var(--blue)',
  },
}

const GCS_CFG: Record<string, { dot: string; color: string }> = {
  operational: { dot: 'var(--green)', color: 'var(--green-text)' },
  degraded: { dot: 'var(--amber)', color: 'var(--amber-text)' },
  offline: { dot: 'var(--red)', color: 'var(--red-text)' },
}

export default function SysOpOverview() {
  const { t, lang } = useI18n(sysOpOverviewMessages)
  const criticals = ALERTS_LIST.filter((a) => a.sev === 'critical').length
  const warnings = ALERTS_LIST.filter((a) => a.sev === 'warning').length
  const activeCount = FLEET.filter((d) => d.state === 'ACTIVE_MISSION').length
  const maintenanceCount = FLEET.filter((d) => d.state === 'MAINTENANCE').length

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <div style={{ maxWidth: 980 }}>
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
            R. Patel · SYS-003 · {t.headerLine}
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 14,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: t.stats.fleetSize,
              value: `${FLEET.length}`,
              sub: t.stats.active(activeCount),
            },
            {
              label: t.stats.gcsStations,
              value: `${GCS_STATIONS.length}`,
              sub: t.stats.operational(
                GCS_STATIONS.filter((g) => g.status === 'operational').length,
              ),
            },
            {
              label: t.stats.criticalAlerts,
              value: `${criticals}`,
              color: criticals > 0 ? 'var(--red-text)' : 'var(--text)',
            },
            {
              label: t.stats.maintenanceQueue,
              value: `${maintenanceCount}`,
              color: maintenanceCount > 0 ? 'var(--amber-text)' : 'var(--text)',
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
                  color: s.color ?? 'var(--text)',
                  lineHeight: 1,
                  marginBottom: s.sub ? 4 : 0,
                }}
              >
                {s.value}
              </div>
              {s.sub && (
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {s.sub}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Alerts */}
        {criticals > 0 && (
          <div
            style={{
              background: 'var(--red-bg)',
              border: '1px solid var(--red-border)',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--red)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--red-text)',
              }}
            >
              {t.criticalRequireAttention(criticals)}
            </span>
          </div>
        )}

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}
        >
          {/* Fleet grid */}
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
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                {t.fleetStatus}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {[
                      t.tableHeaders.droneId,
                      t.tableHeaders.model,
                      t.tableHeaders.battery,
                      t.tableHeaders.gcs,
                      t.tableHeaders.state,
                      t.tableHeaders.lastTelemetry,
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '8px 14px',
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
                  {FLEET.map((d, i) => {
                    const dot = STATE_COLOR[d.state] ?? 'var(--text-3)'
                    const batColor =
                      d.battery < 20
                        ? 'var(--red)'
                        : d.battery < 40
                          ? 'var(--amber)'
                          : 'var(--green)'
                    return (
                      <tr
                        key={d.id}
                        style={{
                          borderBottom:
                            i < FLEET.length - 1
                              ? '1px solid var(--border)'
                              : 'none',
                          background:
                            d.alerts > 0 ? 'var(--red-bg)' : 'transparent',
                        }}
                      >
                        <td
                          style={{
                            padding: '10px 14px',
                            fontSize: 12,
                            fontFamily: 'var(--font-data)',
                            fontWeight: 600,
                            color: 'var(--text)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {d.id}
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            fontSize: 12,
                            color: 'var(--text-2)',
                          }}
                        >
                          {d.model}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 4,
                                background: 'var(--border)',
                                borderRadius: 2,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${d.battery}%`,
                                  height: '100%',
                                  background: batColor,
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontFamily: 'var(--font-data)',
                                color:
                                  batColor === 'var(--red)'
                                    ? 'var(--red-text)'
                                    : 'var(--text-2)',
                              }}
                            >
                              {d.battery}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: d.gcs
                                ? 'var(--green-text)'
                                : 'var(--text-3)',
                            }}
                          >
                            {d.gcs ? t.connected : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: 12,
                              color: dot,
                            }}
                          >
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: dot,
                                display: 'inline-block',
                              }}
                            />
                            {getDroneStatusLabel(d.state as DroneStatus, lang)}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            fontSize: 11,
                            color: 'var(--text-3)',
                            fontFamily: 'var(--font-data)',
                          }}
                        >
                          {d.lastSeen}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* GCS stations */}
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
                {t.gcsStationsTitle}
              </div>
              {GCS_STATIONS.map((g, i) => {
                const cfg = GCS_CFG[g.status]
                const gcsLabel =
                  t.gcsStatus[g.status as keyof typeof t.gcsStatus] ?? g.status
                return (
                  <div
                    key={g.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '13px 20px',
                      borderBottom:
                        i < GCS_STATIONS.length - 1
                          ? '1px solid var(--border)'
                          : 'none',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--text)',
                        }}
                      >
                        {g.location}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-data)',
                          color: 'var(--text-3)',
                          marginTop: 2,
                        }}
                      >
                        {g.id} · {t.dronesConnected(g.connected)} · {t.uptime}{' '}
                        {g.uptime}
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        color: cfg.color,
                        flexShrink: 0,
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
                      {gcsLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alerts panel */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: 'var(--shadow)',
              alignSelf: 'start',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}
              >
                {t.systemAlerts}
              </span>
              {criticals + warnings > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    background: 'var(--red-bg)',
                    color: 'var(--red-text)',
                    border: '1px solid var(--red-border)',
                    borderRadius: 10,
                    padding: '2px 8px',
                    fontWeight: 700,
                  }}
                >
                  {t.openCount(criticals + warnings)}
                </span>
              )}
            </div>
            {ALERTS_LIST.map((a, i) => {
              const cfg = SEV_CFG[a.sev]
              return (
                <div
                  key={a.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom:
                      i < ALERTS_LIST.length - 1
                        ? '1px solid var(--border)'
                        : 'none',
                    background:
                      a.sev === 'critical' ? 'var(--red-bg)' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: cfg.dot,
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: cfg.color,
                          lineHeight: 1.5,
                        }}
                      >
                        {a.msg}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-3)',
                          marginTop: 3,
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{a.id}</span>
                        <span>{a.time}</span>
                      </div>
                    </div>
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
