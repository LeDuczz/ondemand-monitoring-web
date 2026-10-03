// Dedicated Fleet Devices view for System Operator
import { useState } from 'react'

import { useI18n } from '../../../shared/i18n'
import { systemOperatorDevicesScreenMessages } from './SystemOperatorDevicesScreen.messages'

type DeviceItem = {
  id: string
  code: string
  name: string
  model: string
  status: 'AVAILABLE' | 'MAINTENANCE' | 'IDLE_CHARGING' | 'IN_FLIGHT'
  batteryPercent: number
  signalPercent: number
  // Minutes since the last check; `0` renders as "just now".
  lastCheckMinutesAgo: number
}

const INITIAL_DEVICES: DeviceItem[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    code: 'DRONE-ALPHA-01',
    name: 'Matrice 300 RTK',
    model: 'DJI Enterprise M300',
    status: 'AVAILABLE',
    batteryPercent: 100,
    signalPercent: 98,
    lastCheckMinutesAgo: 0,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    code: 'DRONE-BETA-02',
    name: 'Mavic 3 Enterprise',
    model: 'DJI M3E Thermal',
    status: 'IDLE_CHARGING',
    batteryPercent: 78,
    signalPercent: 95,
    lastCheckMinutesAgo: 5,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    code: 'DRONE-GAMMA-03',
    name: 'Skydio X2E',
    model: 'Skydio Autonomous',
    status: 'MAINTENANCE',
    batteryPercent: 45,
    signalPercent: 88,
    lastCheckMinutesAgo: 12,
  },
]

export function SystemOperatorDevicesScreen() {
  const { t } = useI18n(systemOperatorDevicesScreenMessages)
  const [devices] = useState<DeviceItem[]>(INITIAL_DEVICES)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  const filtered = devices.filter(
    (d) => filterStatus === 'ALL' || d.status === filterStatus,
  )

  const statusTone: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    AVAILABLE: {
      bg: '#f0fdf4',
      text: '#166534',
      label: t.statusLabels.AVAILABLE,
    },
    IDLE_CHARGING: {
      bg: '#fefce8',
      text: '#854d0e',
      label: t.statusLabels.IDLE_CHARGING,
    },
    MAINTENANCE: {
      bg: '#fef2f2',
      text: '#991b1b',
      label: t.statusLabels.MAINTENANCE,
    },
    IN_FLIGHT: {
      bg: '#eff6ff',
      text: '#1e40af',
      label: t.statusLabels.IN_FLIGHT,
    },
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Banner */}
      <div
        style={{
          padding: '20px 24px',
          borderRadius: 14,
          background: '#0f172a',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#f8fafc',
            }}
          >
            {t.bannerTitle}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
            {t.bannerSubtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <select
            className="odm-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              height: 38,
              borderRadius: 8,
              fontSize: 13,
              background: '#ffffff',
            }}
          >
            <option value="ALL">{t.filterAll(devices.length)}</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="IDLE_CHARGING">IDLE_CHARGING</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {filtered.map((device) => {
          const tone = statusTone[device.status] || statusTone.AVAILABLE
          return (
            <div
              key={device.id}
              className="odm-card"
              style={{
                padding: 18,
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  className="odm-mono"
                  style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}
                >
                  {device.code}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: tone.bg,
                    color: tone.text,
                  }}
                >
                  {tone.label}
                </span>
              </div>

              <div>
                <div
                  style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}
                >
                  {device.name}
                </div>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>
                  {t.model}: {device.model}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  background: '#f8fafc',
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: '#475569',
                      marginBottom: 4,
                    }}
                  >
                    <span>{t.batteryLevel}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          device.batteryPercent < 50 ? '#ef4444' : '#059669',
                      }}
                    >
                      {device.batteryPercent}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: '#e2e8f0',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${device.batteryPercent}%`,
                        background:
                          device.batteryPercent < 50 ? '#ef4444' : '#10b981',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: '#475569',
                      marginBottom: 4,
                    }}
                  >
                    <span>{t.telemetrySignal}</span>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>
                      {device.signalPercent}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: '#e2e8f0',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${device.signalPercent}%`,
                        background: '#2563eb',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: 10,
                  fontSize: 12,
                  color: '#94a3b8',
                }}
              >
                <span>
                  {t.updated}:{' '}
                  {device.lastCheckMinutesAgo === 0
                    ? t.justNow
                    : t.minutesAgo(device.lastCheckMinutesAgo)}
                </span>
                {device.status === 'MAINTENANCE' && (
                  <a
                    href="#portal/staff/technical/maintenance"
                    style={{
                      color: '#2563eb',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    {t.viewMaintenanceTicket}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
