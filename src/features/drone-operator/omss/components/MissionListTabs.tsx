export type MissionListTab = 'pending' | 'upcoming' | 'history'

interface Props {
  tab: MissionListTab
  counts: Record<MissionListTab, number>
  onChange: (tab: MissionListTab) => void
}

const TABS: { id: MissionListTab; label: string }[] = [
  { id: 'pending', label: 'Chờ phản hồi' },
  { id: 'upcoming', label: 'Sắp tới' },
  { id: 'history', label: 'Lịch sử' },
]

export default function MissionListTabs({ tab, counts, onChange }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        borderBottom: '1px solid var(--border)',
        marginBottom: 20,
      }}
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '8px 14px',
            background: 'none',
            border: 'none',
            borderBottom:
              tab === t.id ? '2px solid var(--blue)' : '2px solid transparent',
            color: tab === t.id ? 'var(--blue)' : 'var(--text-2)',
            fontWeight: tab === t.id ? 600 : 400,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: -1,
          }}
        >
          {t.label}
          {counts[t.id] > 0 && (
            <span
              style={{
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: tab === t.id ? 'var(--blue)' : 'var(--surface-2)',
                color: tab === t.id ? '#fff' : 'var(--text-2)',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
              }}
            >
              {counts[t.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
