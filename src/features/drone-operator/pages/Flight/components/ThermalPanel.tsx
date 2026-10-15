import { Fragment } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { formatNumber, formatTemperature } from '../inFlightFormat'
import type { ControlStatus } from '../inFlightTypes'
import { GlassPanel } from './GlassPanel'
import { thermalPanelMessages } from './ThermalPanel.messages'

export function ThermalPanel({
  controlStatus,
}: {
  controlStatus: ControlStatus | null
}) {
  const { t } = useI18n(thermalPanelMessages)
  const thermalMax = formatTemperature(controlStatus?.maxTemperatureC)
  const thermalRows = [
    [
      t.rows.resolution,
      controlStatus?.thermalFrameWidth && controlStatus?.thermalFrameHeight
        ? `${controlStatus.thermalFrameWidth}x${controlStatus.thermalFrameHeight}`
        : '--',
    ],
    [t.rows.fps, formatNumber(controlStatus?.thermalFps)],
    [t.rows.mode, controlStatus?.thermalMode?.replaceAll('_', ' ') ?? '--'],
    [
      t.rows.frameAge,
      typeof controlStatus?.thermalFrameAgeMs === 'number'
        ? `${controlStatus.thermalFrameAgeMs} ms`
        : '--',
    ],
    [t.rows.min, formatTemperature(controlStatus?.minTemperatureC)],
    [t.rows.avg, formatTemperature(controlStatus?.averageTemperatureC)],
    [t.rows.max, thermalMax],
    [t.rows.threshold, formatTemperature(controlStatus?.thermalThresholdC)],
    [t.rows.palette, controlStatus?.thermalPalette ?? '--'],
    [t.rows.range, controlStatus?.thermalDisplayRangeMode ?? '--'],
    [
      t.rows.scale,
      controlStatus?.thermalDisplayMinC != null &&
      controlStatus?.thermalDisplayMaxC != null
        ? `${formatNumber(controlStatus.thermalDisplayMinC)}-${formatNumber(controlStatus.thermalDisplayMaxC)} °C`
        : '--',
    ],
    [
      t.rows.iso,
      `${controlStatus?.thermalIsothermEnabled ? 'ON' : 'OFF'} / DBG ${controlStatus?.thermalDebugOverlayEnabled ? 'ON' : 'OFF'}`,
    ],
  ]
  return (
    <GlassPanel
      style={{
        position: 'absolute',
        right: 16,
        top: 178,
        width: 260,
        padding: '12px 14px',
        border: controlStatus?.hotspotDetected
          ? '1px solid rgba(251,146,60,.78)'
          : '1px solid rgba(56,189,248,.35)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <strong
          style={{
            fontSize: 12,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: '#e5edf8',
          }}
        >
          {t.title}
        </strong>
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            color:
              controlStatus?.thermalSensorOnline === false
                ? '#fca5a5'
                : '#67e8f9',
          }}
        >
          {controlStatus?.thermalSensorOnline === false
            ? t.sensorOffline
            : t.sensorOnline}
        </span>
      </div>
      <div
        style={{
          marginBottom: 8,
          fontSize: 12,
          fontWeight: 900,
          color: controlStatus?.hotspotDetected ? '#fed7aa' : '#bae6fd',
        }}
      >
        {controlStatus?.hotspotDetected ? t.hotspotDetected : t.noHotspot}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          rowGap: 5,
          columnGap: 12,
          fontSize: 11,
          color: '#cbd5e1',
        }}
      >
        {thermalRows.map(([label, value]) => (
          <Fragment key={label}>
            <span>{label}</span>
            <strong
              style={{
                color:
                  label === t.rows.max && controlStatus?.hotspotDetected
                    ? '#fed7aa'
                    : '#f8fafc',
                fontFamily: 'var(--font-data)',
                textAlign: 'right',
                whiteSpace: 'nowrap',
              }}
            >
              {value}
            </strong>
          </Fragment>
        ))}
      </div>
      {controlStatus?.thermalSourceError && (
        <div
          style={{
            marginTop: 8,
            color: '#fca5a5',
            fontSize: 10,
            lineHeight: 1.35,
          }}
        >
          {t.error(controlStatus.thermalSourceError)}
        </div>
      )}
    </GlassPanel>
  )
}
