import { useI18n } from '../../../shared/i18n'
import type { Language } from '../../../shared/i18n/languageStore'
import type { PreflightItemKey, PreflightItemResult } from '../types/mission'
import { preflightItemMessages } from './PreflightItem.messages'

export type PreflightItemDef = {
  key: PreflightItemKey
  label: string
  detail: string
  code: string
}

/** Bilingual preflight item groups. `key`/`code` stay stable across languages. */
export function preflightGroups(
  _lang: Language,
): { title: string; items: PreflightItemDef[] }[] {
  const item = (key: string, label: string, detail: string): PreflightItemDef => ({ key, label, detail, code: key })
  return [
    {
      title: '1. Thiết bị bay',
      items: [
        item('battery_health', 'Pin máy bay', 'Dung lượng và tình trạng pin theo dữ liệu thiết bị'),
        item('propeller_inspection', 'Cánh quạt', 'Nứt, cong, lỏng hoặc hư hỏng'),
        item('airframe_inspection', 'Thân máy bay', 'Khung, càng đáp và các bộ phận lắp ghép'),
        item('camera_health', 'Hệ thống camera', 'Kết nối, hoạt động và khả năng ghi hình'),
        item('obstacle_sensor_health', 'Cảm biến phát hiện vật cản', 'Tình trạng cảm biến và khả năng phát hiện vật cản'),
      ],
    },
    {
      title: '2. Kết nối và điều khiển',
      items: [
        item('aircraft_connection', 'Kết nối máy bay', 'Kết nối đang hoạt động và telemetry còn mới'),
        item('command_link', 'Tín hiệu điều khiển', 'Chất lượng đường truyền lệnh điều khiển'),
        item('flight_controller', 'Bộ điều khiển máy bay', 'Tình trạng bộ điều khiển bay'),
        item('aircraft_readiness', 'Trạng thái sẵn sàng bay', 'Khả năng sẵn sàng bay do thiết bị xác nhận'),
        item('monitoring_connection', 'Kết nối giám sát', 'Dữ liệu giám sát được cập nhật liên tục'),
        item('manual_override', 'Điều khiển dự phòng', 'Phương án điều khiển dự phòng đã sẵn sàng'),
      ],
    },
    {
      title: '3. Môi trường bay',
      items: [
        item('weather_conditions', 'Điều kiện thời tiết', 'Thời tiết phù hợp với thiết bị và nhiệm vụ'),
        item('flight_visibility', 'Tầm nhìn', 'Tầm nhìn thực tế tại khu vực bay'),
        item('takeoff_area', 'Khu vực cất cánh', 'Khu vực cất cánh thông thoáng và an toàn'),
        item('landing_area', 'Khu vực hạ cánh', 'Khu vực hạ cánh thông thoáng và an toàn'),
        item('airspace_permission', 'Khu vực được phép bay', 'Giấy phép hoặc xác nhận vùng trời hợp lệ'),
      ],
    },
  ]
}

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
  const { t } = useI18n(preflightItemMessages)
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
          {t.pass}
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
          {t.fail}
        </button>
      </div>
      {failed ? (
        <textarea
          className="odm-input"
          rows={2}
          style={{ marginTop: 8, resize: 'none' }}
          placeholder={t.notePlaceholder}
          value={note}
          onChange={(e) => onSetNote(e.target.value)}
        />
      ) : null}
    </div>
  )
}
