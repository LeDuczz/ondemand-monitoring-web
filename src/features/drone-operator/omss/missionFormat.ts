import type { MissionState } from './types'
import type { OpBadgeTone } from './components/OpBadge'

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export function fmtDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const wd = WEEKDAYS[d.getDay()] ?? ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return { date: `${wd}, ${day}/${month}/${year}`, time: `${hh}:${mm}` }
}

export function fmtEnd(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function fmtShortDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function countdown(iso: string, now = Date.now()): string | null {
  const diff = new Date(iso).getTime() - now
  if (diff <= 0) return null
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `Còn ${days} ngày ${hours} giờ`
  const mins = Math.floor((diff % 3600000) / 60000)
  return `Còn ${hours} giờ ${mins} phút`
}

export const STATE_BADGE: Record<
  MissionState,
  { tone: OpBadgeTone; label: string }
> = {
  WAITING_OPERATOR_ACCEPTANCE: { tone: 'amber', label: 'Chờ phản hồi' },
  RESOURCE_ASSIGNING: { tone: 'blue', label: 'Đang chuẩn bị' },
  SCHEDULED: { tone: 'blue', label: 'Đã nhận' },
  CONNECTED: { tone: 'blue', label: 'Đã kết nối' },
  PREFLIGHT_CHECKING: { tone: 'blue', label: 'Kiểm tra trước bay' },
  READY_TO_FLY: { tone: 'green', label: 'Sẵn sàng bay' },
  FAILED_PREFLIGHT: { tone: 'red', label: 'Lỗi kiểm tra' },
  PENDING_APPROVAL: { tone: 'amber', label: 'Chờ duyệt' },
  IN_FLIGHT: { tone: 'green', label: 'Đang bay' },
  RETURNING: { tone: 'blue', label: 'Đang trở về' },
  POSTFLIGHT_CHECKING: { tone: 'blue', label: 'Kiểm tra sau bay' },
  COMPLETED: { tone: 'green', label: 'Hoàn thành' },
  FAILED: { tone: 'red', label: 'Thất bại' },
  CANCELLED: { tone: 'red', label: 'Bị từ chối' },
}

export function actionLabel(state: MissionState): string {
  if (state === 'WAITING_OPERATOR_ACCEPTANCE') return 'Phản hồi'
  if (state === 'IN_FLIGHT') return 'Mở buồng lái'
  if (
    state === 'SCHEDULED' ||
    state === 'CONNECTED' ||
    state === 'READY_TO_FLY'
  )
    return 'Bắt đầu'
  return 'Chi tiết'
}
