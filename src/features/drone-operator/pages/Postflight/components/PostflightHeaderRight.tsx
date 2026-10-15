import { useI18n } from '../../../../../shared/i18n'
import type { BackendMission } from '../../../api/liveMission'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import { postflightHeaderRightMessages } from './PostflightHeaderRight.messages'

export function PostflightHeaderRight({
  postflightMissions,
  effectiveMissionId,
  selectMission,
  deviceLabel,
}: {
  postflightMissions: BackendMission[]
  effectiveMissionId: string
  selectMission: (id: string) => void
  deviceLabel: string
}) {
  const { t } = useI18n(postflightHeaderRightMessages)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {postflightMissions.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: 'var(--tx3, #64748b)',
            }}
          >
            {t.selectMission}
          </span>
          <select
            value={effectiveMissionId}
            onChange={(e) => selectMission(e.target.value)}
            style={{
              height: 34,
              padding: '0 12px',
              borderRadius: 17,
              background: 'var(--sf, #fff)',
              border: '1.5px solid var(--bd, #cbd5e1)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--tx, #0f172a)',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            {postflightMissions.map((m) => (
              <option key={m.id} value={m.id}>
                🎯 {m.missionCode || m.id} ({formatDeviceLabel(m) || 'DEVICE'})
                — {m.status}
              </option>
            ))}
          </select>
        </div>
      )}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 34,
          padding: '0 14px',
          borderRadius: 17,
          background: 'var(--sf3, #f1f5f9)',
          fontWeight: 700,
          fontSize: 13,
          border: '1px solid var(--bd, #cbd5e1)',
        }}
      >
        🚁 {deviceLabel}
      </span>
    </div>
  )
}
