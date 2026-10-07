import { ApiError } from '../../../shared/api/httpClient'

export function planningError(error: unknown): string {
  if (!(error instanceof ApiError))
    return 'Không thể kết nối. Giữ nguyên dữ liệu và thử lại sau.'
  const advice: Record<string, string> = {
    EXECUTION_PLAN_REVISION_CONFLICT:
      'Kế hoạch đã thay đổi. Đã tải lại dữ liệu; kiểm tra lựa chọn và gửi lại khi sẵn sàng.',
    CHECKLIST_COVERAGE_INCOMPLETE:
      'Còn checklist chưa được phân công. Kiểm tra coverage trước khi chốt.',
    MISSION_CANCELLATION_REQUIRES_SAFE_STOP:
      'Mission cần safe-stop và cleanup trước khi hủy. Xem bảng safe-stop bên dưới.',
    MISSION_RESULT_ALREADY_APPROVED:
      'Kết quả đã được duyệt; không thể hủy lịch sử Mission này.',
    RESOURCE_TIME_CONFLICT:
      'Tài nguyên bị trùng lịch. Chọn tài nguyên hoặc thời gian khác và tải lại availability.',
    RESOURCE_ALREADY_RESERVED:
      'Tài nguyên đã được giữ. Tải lại availability và chọn tài nguyên khác.',
    SCHEDULE_CONFLICT:
      'Lịch tài nguyên xung đột. Tải lại availability và chọn lịch khác.',
    EXECUTION_PLAN_NOT_DRAFT:
      'Kế hoạch/Mission đã chốt. Cần amendment hợp lệ để mở planning mới.',
  }
  return `${error.code ? `${error.code}: ` : ''}${advice[error.code ?? ''] ?? error.message}`
}
