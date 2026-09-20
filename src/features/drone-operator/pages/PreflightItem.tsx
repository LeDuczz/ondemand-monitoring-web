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
          detail: 'DRN-02 · 100%',
          code: 'battery_ok',
        },
        { key: 'gps', label: 'GPS', detail: '18 vệ tinh', code: 'gps_ok' },
        {
          key: 'camera',
          label: 'Camera',
          detail: 'Zenmuse P1',
          code: 'camera_ok',
        },
        { key: 'motor', label: 'Động cơ', detail: '', code: 'motor_ok' },
        { key: 'compass', label: 'La bàn', detail: '', code: 'compass_ok' },
      ],
    },
    {
      title: 'Kết nối',
      items: [
        {
          key: 'link',
          label: 'Liên kết telemetry',
          detail: 'heartbeat 10 Hz',
          code: 'link_ok',
        },
        {
          key: 'payload',
          label: 'Payload đã gắn đúng',
          detail: 'RGB Zenmuse P1',
          code: 'payload_mounted_ok',
        },
      ],
    },
    {
      title: 'Môi trường',
      items: [
        {
          key: 'weather',
          label: 'Thời tiết',
          detail: 'gió 6 m/s · dự báo không mưa',
          code: 'weather_ok',
        },
        {
          key: 'airspace',
          label: 'Không phận',
          detail: 'không giao với vùng cấm',
          code: 'airspace_ok',
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
