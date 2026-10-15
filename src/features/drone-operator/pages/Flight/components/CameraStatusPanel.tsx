import { memo } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import type { ControlStatus, IconName } from '../inFlightTypes'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { cameraStatusPanelMessages } from './CameraStatusPanel.messages'
import { GlassPanel } from './GlassPanel'
import { Icon } from './Icon'

export const CameraStatusPanel = memo(function CameraStatusPanel({
  status,
}: {
  status: ControlStatus | null
}) {
  useRenderDiagnostics('CameraStatusPanel')
  const { t } = useI18n(cameraStatusPanelMessages)
  const thermalEnabled = status?.thermalEnabled === true
  const cameraMode = status?.cameraMode === 'DOWN' ? 'DOWN' : 'FRONT'
  const cameraPitch = Number.isFinite(status?.cameraPitchDeg)
    ? Number(status?.cameraPitchDeg)
    : cameraMode === 'DOWN'
      ? -90
      : 0
  const cameraLabel = thermalEnabled
    ? t.thermal
    : cameraPitch <= -89.5
      ? t.downward
      : cameraPitch >= -0.5
        ? t.fpv
        : t.gimbal
  const viewLabel = thermalEnabled
    ? t.heatMap
    : t.pitch(Number(cameraPitch.toFixed(0)))

  return (
    <GlassPanel
      style={{
        position: 'absolute',
        left: 22,
        top: 22,
        width: 176,
        padding: 14,
      }}
    >
      {(
        [
          {
            id: 'camera',
            icon: 'camera',
            label: t.camera,
            value: cameraLabel,
          },
          {
            id: 'view',
            icon: 'eye',
            label: t.view,
            value: viewLabel,
          },
          {
            id: 'mode',
            icon: 'joystick',
            label: t.mode,
            value: t.manual,
          },
        ] as const
      ).map(({ id, icon, label, value }) => (
        <div
          key={id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: id === 'mode' ? 0 : 12,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#cbd5e1',
              fontSize: 12,
            }}
          >
            <Icon name={icon as IconName} size={15} />
            {label}
          </span>
          <strong style={{ color: '#4ade80', fontSize: 12 }}>{value}</strong>
        </div>
      ))}
    </GlassPanel>
  )
})
