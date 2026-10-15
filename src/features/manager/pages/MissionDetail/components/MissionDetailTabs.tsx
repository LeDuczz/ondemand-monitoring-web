import type { Dispatch, SetStateAction } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { missionDetailTabsMessages } from './MissionDetailTabs.messages'

export type MissionDetailTab = 'overview' | 'order' | 'plan' | 'checks'

export function MissionDetailTabs({
  showPlanTab,
  activeTab,
  setTab,
}: {
  showPlanTab: boolean
  activeTab: MissionDetailTab
  setTab: Dispatch<SetStateAction<MissionDetailTab>>
}) {
  const { t } = useI18n(missionDetailTabsMessages)
  const tabs: Array<{ id: MissionDetailTab; label: string }> = [
    { id: 'overview', label: t.tabs.overview },
    { id: 'order', label: t.tabs.order },
    ...(showPlanTab ? [{ id: 'plan' as const, label: t.tabs.plan }] : []),
    { id: 'checks', label: t.tabs.checks },
  ]
  return (
    <div className="mng-seg odm-md-tabs" role="tablist" aria-label={t.tabsAria}>
      {tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={activeTab === item.id}
          className={`mng-seg-btn${activeTab === item.id ? ' is-active' : ''}`}
          onClick={() => setTab(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
