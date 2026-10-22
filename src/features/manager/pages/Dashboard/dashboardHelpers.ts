import type { ActionItem } from '../../types/dashboard'
import type { ManagerRoute } from '../../routes'
import type { Language } from '../../../../shared/i18n'
import {
  formatOrderAge,
  formatMissionCountdown,
  formatTicketAge,
  formatMinutesAgo,
  formatFlightMinutes,
} from '../../lib/actionItemAge'

export function actionItemRoute(item: ActionItem): ManagerRoute {
  switch (item.type) {
    case 'ORDER_PENDING':
      return { screen: 'orderReview', orderId: item.orderId }
    case 'MISSION_UNASSIGNED':
      return { screen: 'missionDispatch', missionId: item.missionId }
    case 'MAINTENANCE_TICKET':
      return { screen: 'maintenance' }
    case 'MEDIA_ACTION':
      return { screen: 'media' }
    case 'MISSION_FLYING':
      return { screen: 'live', missionId: item.missionId }
  }
}

export function actionItemAge(
  now: Date,
  item: ActionItem,
  lang: Language,
): string {
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
