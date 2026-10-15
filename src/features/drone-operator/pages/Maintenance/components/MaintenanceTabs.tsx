import { useI18n } from '../../../../../shared/i18n'
import type { MaintenanceTab } from '../maintenanceHelpers'
import { maintenanceTabsMessages } from './MaintenanceTabs.messages'

export function MaintenanceTabs({
  activeTab,
  onChange,
  myOpenCount,
  activeCount,
  resolvedCount,
}: {
  activeTab: MaintenanceTab
  onChange: (tab: MaintenanceTab) => void
  myOpenCount: number
  activeCount: number
  resolvedCount: number
}) {
  const { t } = useI18n(maintenanceTabsMessages)

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        borderBottom: '1px solid #e2e8f0',
        marginBottom: 20,
      }}
    >
      <button
        type="button"
        onClick={() => onChange('MY_TICKETS')}
        style={{
          padding: '10px 16px',
          background: 'none',
          border: 'none',
          borderBottom:
            activeTab === 'MY_TICKETS'
              ? '2px solid #2563eb'
              : '2px solid transparent',
          fontWeight: activeTab === 'MY_TICKETS' ? 700 : 500,
          color: activeTab === 'MY_TICKETS' ? '#2563eb' : '#64748b',
          cursor: 'pointer',
          fontSize: 13.5,
          transition: 'all 0.15s ease',
        }}
      >
        {t.tabMine(myOpenCount)}
      </button>
      <button
        type="button"
        onClick={() => onChange('ALL_ACTIVE')}
        style={{
          padding: '10px 16px',
          background: 'none',
          border: 'none',
          borderBottom:
            activeTab === 'ALL_ACTIVE'
              ? '2px solid #2563eb'
              : '2px solid transparent',
          fontWeight: activeTab === 'ALL_ACTIVE' ? 700 : 500,
          color: activeTab === 'ALL_ACTIVE' ? '#2563eb' : '#64748b',
          cursor: 'pointer',
          fontSize: 13.5,
        }}
      >
        {t.tabAllActive(activeCount)}
      </button>
      <button
        type="button"
        onClick={() => onChange('RESOLVED')}
        style={{
          padding: '10px 16px',
          background: 'none',
          border: 'none',
          borderBottom:
            activeTab === 'RESOLVED'
              ? '2px solid #2563eb'
              : '2px solid transparent',
          fontWeight: activeTab === 'RESOLVED' ? 700 : 500,
          color: activeTab === 'RESOLVED' ? '#2563eb' : '#64748b',
          cursor: 'pointer',
          fontSize: 13.5,
        }}
      >
        {t.tabResolved(resolvedCount)}
      </button>
    </div>
  )
}
