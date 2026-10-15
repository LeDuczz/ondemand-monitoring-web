import type { DeliveryStatus as WorkflowDeliveryStatus } from '../../../delivery/types'
import type { MissionStatus } from '../../../../shared/types/domain'
import type { UiTone } from '../../../../shared/components/ui'
import type {
  MissionResultApprovalStatus,
  MissionStaffAssignmentResponse,
} from '../../types/missions'

export type StatusChip = 'ALL' | MissionStatus
export type DeliveryStatus =
  | WorkflowDeliveryStatus
  | MissionResultApprovalStatus
  | 'NO_RESULT'
  | 'NOT_READY'
  | 'LOADING'

export type DeliveryLabelMessages = {
  deliveryStatus: {
    none: string
    approved: string
    pendingApproval: string
    rejected: string
    noResult: string
    processing: string
    readyForPreview: string
    customerReview: string
    revisionRequested: string
    finalPaymentPending: string
    readyForDelivery: string
    delivered: string
    loading: string
  }
}

export function formatScheduled(
  start: string | null,
  end: string | null,
  locale: 'vi-VN' | 'en-US',
): string {
  if (!start) return '—'
  const d = new Date(start)
  const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
  const startTime = d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  if (!end) return `${dateStr} ${startTime}`
  const endD = new Date(end)
  const endTime = endD.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${dateStr} ${startTime}–${endTime}`
}

/** `acceptedLabel` comes from the caller's messages (e.g. "2/4 accepted"). */
export function formatStaffSummary(
  assignments: MissionStaffAssignmentResponse[] | undefined,
  acceptedLabel: (accepted: number, total: number) => string,
) {
  const active = assignments ?? []
  if (active.length === 0) return '—'
  const accepted = active.filter(
    (item) => item.responseStatus === 'ACCEPTED',
  ).length
  return acceptedLabel(accepted, active.length)
}

export function deliveryTone(status: DeliveryStatus): UiTone {
  if (status === 'APPROVED') return 'success'
  if (status === 'PENDING_MANAGER_APPROVAL') return 'info'
  if (status === 'REJECTED') return 'danger'
  if (status === 'DELIVERED') return 'success'
  if (status === 'REVISION_REQUESTED') return 'danger'
  if (
    ['CUSTOMER_REVIEW', 'FINAL_PAYMENT_PENDING', 'READY_FOR_DELIVERY'].includes(
      status,
    )
  )
    return 'info'
  return 'neutral'
}

export function deliveryLabel(
  status: DeliveryStatus,
  t: DeliveryLabelMessages,
) {
  const d = t.deliveryStatus
  if (status === 'APPROVED') return d.approved
  if (status === 'PENDING_MANAGER_APPROVAL') return d.pendingApproval
  if (status === 'REJECTED') return d.rejected
  if (status === 'NO_RESULT') return d.noResult
  if (status === 'PROCESSING') return d.processing
  if (status === 'READY_FOR_MANAGER_REVIEW') return d.readyForPreview
  if (status === 'CUSTOMER_REVIEW') return d.customerReview
  if (status === 'REVISION_REQUESTED') return d.revisionRequested
  if (status === 'FINAL_PAYMENT_PENDING') return d.finalPaymentPending
  if (status === 'PAYMENT_CONFIRMED' || status === 'READY_FOR_DELIVERY')
    return d.readyForDelivery
  if (status === 'DELIVERED') return d.delivered
  if (status === 'LOADING') return d.loading
  return d.none
}
