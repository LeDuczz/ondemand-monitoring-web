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
  lang: Language,
): { title: string; items: PreflightItemDef[] }[] {
  const t = preflightItemMessages[lang]
  return [
    {
      title: t.groups.device,
      items: [
        { key: 'battery', ...t.items.battery, code: 'battery_ok' },
        { key: 'camera', ...t.items.camera, code: 'camera_ok' },
        { key: 'lidar', ...t.items.lidar, code: 'lidar_ok' },
      ],
    },
    {
      title: t.groups.connection,
      items: [
        { key: 'px4', ...t.items.px4, code: 'px4_ok' },
        { key: 'mavsdk', ...t.items.mavsdk, code: 'mavsdk_ok' },
        { key: 'px4Control', ...t.items.px4Control, code: 'px4_control_ok' },
        {
          key: 'mavsdkHealth',
          ...t.items.mavsdkHealth,
          code: 'mavsdk_health_ok',
        },
      ],
    },
    {
      title: t.groups.system,
      items: [
        { key: 'backend', ...t.items.backend, code: 'backend_ok' },
        { key: 'media', ...t.items.media, code: 'media_ok' },
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
