import type { OrderStatus, MissionStatus, StatusTone } from '../../../shared/types/domain'

type StatusMeta = { label: string; tone: StatusTone }

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  DRAFT: { label: 'Nháp', tone: 'gray' },
  AI_ANALYZED: { label: 'Đã phân tích AI', tone: 'blue' },
  SUBMITTED: { label: 'Đã gửi duyệt', tone: 'yellow' },
  PENDING: { label: 'Đang duyệt', tone: 'yellow' },
  APPROVED: { label: 'Đã duyệt', tone: 'blue' },
  SCHEDULED: { label: 'Đã lên lịch', tone: 'blue' },
  IN_PROGRESS: { label: 'Đang thực hiện', tone: 'green' },
  COMPLETED: { label: 'Hoàn thành', tone: 'green' },
  REJECTED: { label: 'Bị từ chối', tone: 'red' },
  CANCELLED: { label: 'Đã huỷ', tone: 'gray' },
}

export const MISSION_STATUS_META: Record<MissionStatus, StatusMeta> = {
  CREATED: { label: 'Mới tạo', tone: 'gray' },
  RESOURCE_ASSIGNING: { label: 'Phân công nguồn lực', tone: 'yellow' },
  WAITING_OPERATOR_ACCEPTANCE: { label: 'Chờ phi công xác nhận', tone: 'yellow' },
  SCHEDULED: { label: 'Đã lên lịch', tone: 'blue' },
  CONNECTED: { label: 'Đã kết nối', tone: 'blue' },
  PREFLIGHT_CHECKING: { label: 'Kiểm tra trước bay', tone: 'blue' },
  READY_TO_FLY: { label: 'Sẵn sàng bay', tone: 'green' },
  FAILED_PREFLIGHT: { label: 'Lỗi kiểm tra', tone: 'red' },
  PENDING_APPROVAL: { label: 'Chờ phê duyệt', tone: 'yellow' },
  IN_FLIGHT: { label: 'Đang bay', tone: 'blue' },
  IN_PROGRESS: { label: 'Đang thực hiện', tone: 'blue' },
  RETURNING: { label: 'Đang quay về', tone: 'orange' },
  POSTFLIGHT_CHECKING: { label: 'Kiểm tra sau bay', tone: 'orange' },
  COMPLETED: { label: 'Hoàn thành', tone: 'green' },
  FAILED: { label: 'Thất bại', tone: 'red' },
  CANCELLED: { label: 'Đã huỷ', tone: 'gray' },
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
