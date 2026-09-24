import type { PreflightItemKey, PreflightItemResult } from '../types/mission'

export type PreflightItemDef = {
  key: PreflightItemKey
  label: string
  detail: string
  code: string
}

export const PREFLIGHT_GROUPS: { title: string; items: PreflightItemDef[] }[] =
  [
    {
      title: 'Thiết bị',
      items: [
        {
          key: 'battery',
          label: 'Pin',
          detail: 'telemetry hiện tại',
          code: 'battery_ok',
        },
        {
          key: 'camera',
          label: 'Camera',
          detail: 'camera hiện tại',
          code: 'camera_ok',
        },
        {
          key: 'lidar',
          label: 'LiDAR',
          detail: 'range sensor',
          code: 'lidar_ok',
        },
        {
          key: 'modules',
          label: 'Module Check',
          detail: 'system modules',
          code: 'modules_ok',
        },
      ],
    },
    {
      title: 'Kết nối',
      items: [
        {
          key: 'gazebo',
          label: 'Gazebo Simulation',
          detail: 'simulation world',
          code: 'gazebo_ok',
        },
        {
          key: 'px4',
          label: 'PX4 Flight Controller',
          detail: 'flight controller',
          code: 'px4_ok',
        },
        {
          key: 'mavsdk',
          label: 'MAVSDK Connection',
          detail: 'telemetry bridge',
          code: 'mavsdk_ok',
        },
        {
          key: 'px4Control',
          label: 'PX4 Control',
          detail: 'command channel',
          code: 'px4_control_ok',
        },
        {
          key: 'localPosition',
          label: 'Local Position',
          detail: 'PX4 local pose',
          code: 'local_position_ok',
        },
        {
          key: 'mavsdkHealth',
          label: 'MAVSDK Health',
          detail: 'armable health',
          code: 'mavsdk_health_ok',
        },
      ],
    },
    {
      title: 'Hệ thống',
      items: [
        {
          key: 'backend',
          label: 'Backend Connection',
          detail: 'mission backend',
          code: 'backend_ok',
        },
        {
          key: 'media',
          label: 'Media Upload',
          detail: 'upload pipeline',
          code: 'media_ok',
        },
      ],
    },
  ]

export function PreflightItemRow({
  def,
  result,
  note,
  onSetResult,
  onSetNote,
}: {
  def: PreflightItemDef
  result: PreflightItemResult | null
  note: string
  onSetResult: (result: PreflightItemResult) => void
  onSetNote: (note: string) => void
}) {
  const failed = result === 'fail'
  return (
    <div
      style={{
        background: failed ? 'var(--red-bg)' : 'var(--sf)',
        border: `1.5px solid ${failed ? 'var(--red-dot)' : 'var(--bd)'}`,
        borderRadius: 12,
        padding: '10px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
            background:
              result === 'ok'
                ? 'var(--green-bg)'
                : failed
                  ? 'var(--red-solid)'
                  : 'var(--sf3)',
            color:
              result === 'ok'
                ? 'var(--green-fg)'
                : failed
                  ? 'var(--red-on)'
                  : 'var(--tx2)',
            fontWeight: 700,
          }}
        >
          {result === 'ok' ? '✓' : failed ? '✕' : '•'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{def.label}</div>
          <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
            {def.detail ? `${def.detail} · ` : ''}
            <span className="odm-mono">{def.code}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSetResult('ok')}
          className="odm-btn"
          style={{
            minWidth: 78,
            background: result === 'ok' ? 'var(--green-solid)' : undefined,
            color: result === 'ok' ? 'var(--green-on)' : undefined,
            borderColor: result === 'ok' ? 'var(--green-solid)' : undefined,
          }}
        >
          Đạt
        </button>
        <button
          type="button"
          onClick={() => onSetResult('fail')}
          className="odm-btn"
          style={{
            minWidth: 96,
            background: failed ? 'var(--red-solid)' : undefined,
            color: failed ? 'var(--red-on)' : undefined,
            borderColor: failed ? 'var(--red-solid)' : undefined,
          }}
        >
          Không đạt
        </button>
      </div>
      {failed ? (
        <textarea
          className="odm-input"
          rows={2}
          style={{ marginTop: 8, resize: 'none' }}
          placeholder="Ghi chú lỗi (bắt buộc khi không đạt)"
          value={note}
          onChange={(e) => onSetNote(e.target.value)}
        />
      ) : null}
    </div>
  )
}
