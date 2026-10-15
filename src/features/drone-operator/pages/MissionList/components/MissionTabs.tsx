import { useI18n } from '../../../../../shared/i18n'
import type { OperatorMissionTab } from '../../../types/mission'
import { missionTabsMessages } from './MissionTabs.messages'

export function MissionTabs({
  tab,
  counts,
  onChange,
}: {
  tab: OperatorMissionTab
  counts: Record<OperatorMissionTab, number>
  onChange: (tab: OperatorMissionTab) => void
}) {
  const { t } = useI18n(missionTabsMessages)

  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 2,
        background: 'var(--sf)',
        border: '1px solid var(--bd)',
        borderRadius: '8px 8px 0 0',
        padding: '0 8px',
      }}
    >
      {(Object.keys(t.tabLabel) as OperatorMissionTab[]).map((tabKey) => (
        <button
          key={tabKey}
          type="button"
          role="tab"
          aria-selected={tab === tabKey}
          onClick={() => onChange(tabKey)}
          style={{
            height: 38,
            padding: '0 14px',
            border: 0,
            borderBottom: `2px solid ${tab === tabKey ? 'var(--ink)' : 'transparent'}`,
            marginBottom: -1,
            background: 'transparent',
            fontWeight: 600,
            fontSize: 13,
            color: tab === tabKey ? 'var(--tx)' : 'var(--tx3)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {t.tabLabel[tabKey]}
          <span
            className="odm-tn"
            style={{
              fontSize: 11,
              padding: '1px 6px',
              borderRadius: 9,
              background: 'var(--sf3)',
            }}
          >
            {counts[tabKey]}
          </span>
        </button>
      ))}
    </div>
  )
}
