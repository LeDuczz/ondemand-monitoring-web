import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import type { OperatorMission } from '../../../types/mission'
import { InfoRow } from './InfoRow'
import { droneDeviceCardMessages } from './DroneDeviceCard.messages'

export function DroneDeviceCard({ mission }: { mission: OperatorMission }) {
  const { t } = useI18n(droneDeviceCardMessages)
  const droneLabel = formatDeviceLabel(mission) ?? t.noDeviceAssigned
  const deviceInfoRows = [
    { icon: '#', label: 'Device ID', value: mission.deviceId },
    { icon: 'ID', label: 'Device code', value: mission.deviceCode },
    { icon: 'SN', label: 'Serial', value: mission.deviceSerialNumber },
    { icon: '●', label: t.status, value: mission.deviceStatus },
    { icon: 'DR', label: 'Drone code', value: mission.droneCode },
    { icon: 'NM', label: t.droneName, value: mission.droneName },
    { icon: 'MD', label: 'Model', value: mission.droneModel },
    { icon: 'MC', label: 'Model code', value: mission.deviceModelCode },
    { icon: 'MF', label: t.manufacturer, value: mission.deviceManufacturer },
    { icon: 'PL', label: 'Payload', value: mission.dronePayload },
    { icon: 'ST', label: t.station, value: mission.droneStation },
    {
      icon: '↔',
      label: t.stationDistance,
      value:
        mission.droneStationDistanceKm == null
          ? null
          : `${mission.droneStationDistanceKm} km`,
    },
    {
      icon: '%',
      label: t.readiness,
      value:
        mission.droneReadinessPct == null
          ? null
          : `${mission.droneReadinessPct}%`,
    },
    {
      icon: '⏱',
      label: t.hoursSinceMaintenanceLabel,
      value:
        mission.droneHoursSinceMaintenance == null
          ? null
          : `${mission.droneHoursSinceMaintenance} ${t.hourUnit}`,
    },
  ].filter((row) => row.value != null && String(row.value).trim() !== '')

  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>{t.title}</span>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Device icon placeholder */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: 'var(--sf2)',
              border: '1px solid var(--bd)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 22,
            }}
          >
            🚁
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
              {droneLabel}
            </div>
            {(mission.droneModel || mission.dronePayload) && (
              <div
                style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 4 }}
              >
                {[mission.droneModel, mission.dronePayload]
                  .filter(Boolean)
                  .join(' / ')}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusBadge
                tone={
                  mission.droneReadinessPct != null &&
                  mission.droneReadinessPct >= 80
                    ? 'green'
                    : mission.droneReadinessPct != null
                      ? 'yellow'
                      : 'gray'
                }
              >
                {mission.droneReadinessPct == null
                  ? t.noTelemetry
                  : t.readyPercent(mission.droneReadinessPct)}
              </StatusBadge>
            </div>
          </div>
        </div>
        {(mission.droneStation ||
          mission.droneHoursSinceMaintenance != null) && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--bd)',
              fontSize: 11.5,
              color: 'var(--tx3)',
            }}
          >
            {mission.droneStation && (
              <span>
                {t.pickupAt} {mission.droneStation}
              </span>
            )}
            {mission.droneStation && mission.droneStationDistanceKm != null && (
              <span>
                {' '}
                · {t.distanceWord} {mission.droneStationDistanceKm} km
              </span>
            )}
            {mission.droneHoursSinceMaintenance != null && (
              <span style={{ display: 'block', marginTop: 2 }}>
                {t.hoursSinceMaintenance(mission.droneHoursSinceMaintenance)}
              </span>
            )}
          </div>
        )}
        {deviceInfoRows.length > 0 ? (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--bd)',
            }}
          >
            {deviceInfoRows.map((row) => (
              <InfoRow
                key={`${row.icon}-${row.label}`}
                icon={row.icon}
                label={row.label}
                value={String(row.value)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
