import { actionItemAge, actionItemRoute } from '../dashboardHelpers'
import { managerHref } from '../../../routes'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'
import type {
  ManagerDashboardResponse,
  ActionItem,
} from '../../../types/dashboard'

export function ActionListCard({
  filter,
  setFilter,
  presentTypes,
  data,
  visibleItems,
  now,
}: {
  filter:
    | 'ORDER_PENDING'
    | 'MISSION_UNASSIGNED'
    | 'MAINTENANCE_TICKET'
    | 'MEDIA_ACTION'
    | 'MISSION_FLYING'
    | 'all'
  setFilter: Dispatch<
    SetStateAction<
      | 'ORDER_PENDING'
      | 'MISSION_UNASSIGNED'
      | 'MAINTENANCE_TICKET'
      | 'MEDIA_ACTION'
      | 'MISSION_FLYING'
      | 'all'
    >
  >
  presentTypes: (
    | 'ORDER_PENDING'
    | 'MISSION_UNASSIGNED'
    | 'MAINTENANCE_TICKET'
    | 'MEDIA_ACTION'
    | 'MISSION_FLYING'
  )[]
  data: ManagerDashboardResponse
  visibleItems: ActionItem[]
  now: Date
}) {
  const { t, lang } = useI18n(dashboardPageMessages)
  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span>{t.actionListTitle}</span>
        {filter !== 'all' ? (
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-sm"
            onClick={() => setFilter('all')}
          >
            {t.clearFilter}
          </button>
        ) : null}
      </div>
      {presentTypes.length > 1 ? (
        <div className="odm-mgr-filter-chips">
          {presentTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`odm-mgr-chip ${filter === type ? 'is-active' : ''}`}
              aria-pressed={filter === type}
              onClick={() =>
                setFilter((current) => (current === type ? 'all' : type))
              }
            >
              {t.actionTypeFilter[type]} (
              {data.actionItems.filter((item) => item.type === type).length})
            </button>
          ))}
        </div>
      ) : null}
      {visibleItems.length === 0 ? (
        <div className="odm-mgr-empty-list">
          <div className="odm-mgr-empty-list-title">{t.emptyListTitle}</div>
          <div className="odm-mgr-empty-list-desc">
            {t.emptyListDescription}
          </div>
        </div>
      ) : (
        <ul className="odm-mgr-action-list">
          {visibleItems.map((item) => (
            <li key={item.id} className="odm-mgr-action-row">
              <div className="odm-mgr-action-text">
                <div className="odm-mgr-action-title">{item.title}</div>
                <div className="odm-mgr-action-subtitle">{item.subtitle}</div>
              </div>
              <div className="odm-mgr-action-age odm-tn">
                {actionItemAge(now, item, lang)}
              </div>
              <a
                className="odm-btn odm-btn-sm"
                href={managerHref(actionItemRoute(item))}
              >
                {t.actionType[item.type]}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
