import type { Dispatch, SetStateAction } from 'react'

import { Card, EmptyState } from '../../../../../shared/components/ui'
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
    <Card
      title={t.actionListTitle}
      actions={
        filter !== 'all' ? (
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-sm"
            onClick={() => setFilter('all')}
          >
            {t.clearFilter}
          </button>
        ) : null
      }
    >
      {presentTypes.length > 1 ? (
        <div className="mng-seg mng-dash-seg">
          {presentTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`mng-seg-btn${filter === type ? ' is-active' : ''}`}
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
        <EmptyState
          title={t.emptyListTitle}
          description={t.emptyListDescription}
        />
      ) : (
        <ul className="mng-order-list">
          {visibleItems.map((item) => (
            <li key={item.id} className="mng-action-item">
              <div className="mng-order-text">
                <div className="mng-cell-main">{item.title}</div>
                <div className="mng-cell-sub">{item.subtitle}</div>
                <div className="mng-cell-sub odm-tn">
                  {actionItemAge(now, item, lang)}
                </div>
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
    </Card>
  )
}
