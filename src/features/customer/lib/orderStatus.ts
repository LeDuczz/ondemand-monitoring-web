import type { Language } from '../../../shared/i18n'
import type {
  OrderStatus,
  MissionStatus,
  StatusTone,
} from '../../../shared/types/domain'
import { orderStatusMessages } from './orderStatus.messages'

export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  DRAFT: 'gray',
  AI_ANALYZED: 'blue',
  SUBMITTED: 'yellow',
  PENDING: 'yellow',
  NEEDS_INFO: 'orange',
  APPROVED: 'blue',
  SCHEDULED: 'blue',
  IN_PROGRESS: 'green',
  COMPLETED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
}

export const MISSION_STATUS_TONE: Record<MissionStatus, StatusTone> = {
  CREATED: 'gray',
  WAITING_DEPOSIT: 'yellow',
  RESOURCE_ASSIGNING: 'yellow',
  WAITING_CREW_CONFIRMATION: 'yellow',
  WAITING_OPERATOR_ACCEPTANCE: 'yellow',
  SCHEDULED: 'blue',
  CONNECTED: 'blue',
  PREFLIGHT_CHECKING: 'blue',
  READY_TO_FLY: 'green',
  FAILED_PREFLIGHT: 'red',
  PENDING_APPROVAL: 'yellow',
  IN_FLIGHT: 'blue',
  IN_PROGRESS: 'blue',
  RETURNING: 'orange',
  POSTFLIGHT_CHECKING: 'orange',
  PENDING_REVIEW: 'yellow',
  COMPLETED: 'green',
  FAILED: 'red',
  CANCELLED: 'gray',
}

export type StatusMeta = { label: string; tone: StatusTone }

export function getOrderStatusMeta(
  status: OrderStatus,
  lang: Language,
): StatusMeta {
  return {
    label: orderStatusMessages[lang].order[status],
    tone: ORDER_STATUS_TONE[status],
  }
}

export function getMissionStatusMeta(
  status: MissionStatus,
  lang: Language,
): StatusMeta {
  return {
    label: orderStatusMessages[lang].mission[status],
    tone: MISSION_STATUS_TONE[status],
  }
}

export function fmtDate(iso: string, locale: 'vi-VN' | 'en-US'): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Date first, then the time: `17/10/2026 02:44` (vi) / `10/17/2026, 02:44 AM` (en). */
export function fmtDateTime(iso: string, locale: 'vi-VN' | 'en-US'): string {
  const date = new Date(iso)
  const time = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return locale === 'vi-VN'
    ? `${fmtDate(iso, locale)} ${time}`
    : `${fmtDate(iso, locale)}, ${time}`
}
