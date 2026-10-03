import type { MissionStatus } from '../../../../shared/types/domain'

export type MissionRow = {
  id: string
  code: string
  orderId: string
  orderTitle: string
  address: string | null
  status: MissionStatus
  scheduledStartAt: string | null
  scheduledEndAt: string | null
  startedAt: string | null
  completedAt: string | null
  description: string | null
  /** Best "when" for lists: finished, else started, else scheduled. */
  when: string | null
}

export type MissionMediaProgress = {
  available: number
  processing: number
  rejected: number
  /** Nothing yet, still being validated, or everything is out. */
  phase: 'none' | 'processing' | 'ready'
}
