import type { Dispatch, SetStateAction } from 'react'

import type { Language } from '../../../../../shared/i18n'
import { useI18n } from '../../../../../shared/i18n'
import {
  formatFlightMinutes,
  formatMinutesAgo,
  formatMissionCountdown,
  formatOrderAge,
  formatTicketAge,
} from '../../../lib/actionItemAge'
import { managerHref, type ManagerRoute } from '../../../routes'
import type {
  ActionItem,
  ManagerDashboardResponse,
} from '../../../types/dashboard'
import { actionListCardMessages } from './ActionListCard.messages'

type ActionItemType = ActionItem['type']

function actionItemRoute(item: ActionItem): ManagerRoute {
  switch (item.type) {
    case 'ORDER_PENDING':
      return { screen: 'orderReview', orderId: item.orderId }
    case 'MISSION_UNASSIGNED':
      return { screen: 'missionDispatch', missionId: item.missionId }
    case 'MAINTENANCE_TICKET':
      return { screen: 'maintenance' }
    case 'MEDIA_ACTION':
      return { screen: 'dashboard' }
    case 'MISSION_FLYING':
      return { screen: 'live', missionId: item.missionId }
  }
}

function actionItemAge(now: Date, item: ActionItem, lang: Language): string {
  switch (item.type) {
    case 'ORDER_PENDING':
      return formatOrderAge(now, item.submittedAtIso, 24, lang)
    case 'MISSION_UNASSIGNED':
      return formatMissionCountdown(now, item.scheduledStartIso, lang)
    case 'MAINTENANCE_TICKET':
      return formatTicketAge(now, item.openedAtIso, lang)
    case 'MEDIA_ACTION':
      return formatMinutesAgo(now, item.createdAtIso, lang)
    case 'MISSION_FLYING':
      return formatFlightMinutes(now, item.startedAtIso, lang)
  }
}

export function ActionListCard({
  filter,
  setFilter,
  presentTypes,
  data,
  visibleItems,
  now,
}: {
  filter: ActionItemType | 'all'
  setFilter: Dispatch<SetStateAction<ActionItemType | 'all'>>
  presentTypes: ActionItemType[]
  data: ManagerDashboardResponse
  visibleItems: ActionItem[]
  now: Date
}) {
  const { t, lang } = useI18n(actionListCardMessages)
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
