import type { OperatorProfile } from '../types'

interface Props {
  profile: OperatorProfile | null
  onGoAvailability?: () => void
}

const WEEKDAYS = [
  'Chủ nhật',
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
  'Thứ bảy',
]

function todayLabel(): string {
  const d = new Date()
  const wd = WEEKDAYS[d.getDay()] ?? ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${wd}, ${day}/${month} · ${hh}:${mm}`
}

export function certWarning(dateStr: string): string | null {
  const diff = new Date(dateStr).getTime() - Date.now()
  const days = Math.floor(diff / 86400000)
  if (days > 30) return null
  const label = dateStr.split('T')[0]?.split('-').reverse().join('/')
  if (days <= 0) return `Chứng chỉ đã hết hạn ${label}`
  return `Chứng chỉ hết hạn ${label}, còn ${days} ngày. Gia hạn để không bị chặn phân công.`
}

export default function MissionListHeader({
  profile,
  onGoAvailability,
}: Props) {
  const certMsg = profile ? certWarning(profile.certExpiryDate) : null

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 4,
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 4px',
            }}
          >
            Mission của tôi
          </h1>
          {profile && (
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {profile.fullName} · phi công hạng {profile.licenseGrade} ·{' '}
              {todayLabel()}
            </div>
          )}
        </div>
        {onGoAvailability && (
          <button
            className="op-btn op-btn-primary"
            onClick={onGoAvailability}
            style={{ flexShrink: 0 }}
          >
            Khai báo lịch rảnh
          </button>
        )}
      </div>

      {certMsg && (
        <div
          style={{
            background: 'var(--amber-bg)',
            border: '1px solid var(--amber-border)',
            borderRadius: 8,
            padding: '10px 14px',
            margin: '16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: 'var(--text)',
          }}
        >
          <span>⚠</span>
          <span style={{ flex: 1 }}>{certMsg}</span>
        </div>
      )}
    </>
  )
}
