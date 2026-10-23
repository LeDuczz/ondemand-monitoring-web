import { ApiError } from '../../../shared/api/httpClient'

export function planningBlocker(code: string): string {
  const advice: Record<string, string> = {
    ORDER_NOT_APPROVED: 'Order chưa ở trạng thái cho phép chốt kế hoạch.',
    INVOICE_NOT_PAYABLE:
      'Khách hàng cần chấp nhận báo giá trước khi tạo Mission.',
    FINAL_PAYMENT_REQUIRED:
      'Khách hàng cần thanh toán đủ trước khi nhận bản gốc.',
    DELIVERABLE_NOT_RELEASED: 'Bản gốc chưa được bàn giao cho khách hàng.',
    NO_EFFECTIVE_MISSIONS:
      'Thêm ít nhất một Mission vào kế hoạch trước khi chốt.',
    CHECKLIST_ASSIGNMENT_NOT_FINALIZED: 'Phân công checklist chưa được chốt.',
    CHECKLIST_EXECUTION_INTEGRITY_INVALID:
      'Phân công checklist cần được kiểm tra lại trước khi chốt.',
    MULTI_MISSION_LEGACY_ORDER_NOT_MIGRATED:
      'Kế hoạch cũ cần được kiểm tra trước khi tiếp tục.',
    INVALID_REQUEST: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra và thử lại.',
    ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này.',
    UNAUTHORIZED: 'Vui lòng đăng nhập lại để tiếp tục.',
    EXECUTION_PLAN_REVISION_CONFLICT:
      'Kế hoạch đã được thay đổi ở phiên bản khác. Vui lòng tải lại dữ liệu.',
    CHECKLIST_COVERAGE_INCOMPLETE:
      'Còn checklist chưa được phân công. Kiểm tra các yêu cầu trước khi chốt kế hoạch.',
    MISSION_CANCELLATION_REQUIRES_SAFE_STOP:
      'Mission chưa đủ điều kiện hủy. Cần hoàn tất xác nhận an toàn và đóng phiên vận hành trước khi hủy.',
    MISSION_SAFE_STOP_NOT_READY:
      'Mission chưa ở trạng thái an toàn để tiếp tục. Làm mới trạng thái hoặc chờ nhân sự vận hành.',
    MISSION_SAFE_STOP_FAILED:
      'Dừng an toàn chưa hoàn tất. Làm mới trạng thái và liên hệ nhân sự vận hành.',
    MISSION_RESULT_ALREADY_APPROVED:
      'Kết quả đã được duyệt; không thể hủy lịch sử Mission này.',
    RESOURCE_TIME_CONFLICT:
      'Tài nguyên bị trùng lịch. Chọn tài nguyên hoặc thời gian khác và tải lại danh sách khả dụng.',
    RESOURCE_ALREADY_RESERVED:
      'Tài nguyên đã được giữ. Tải lại danh sách khả dụng và chọn tài nguyên khác.',
    SCHEDULE_CONFLICT:
      'Lịch tài nguyên xung đột. Tải lại danh sách khả dụng và chọn lịch khác.',
    EXECUTION_PLAN_NOT_DRAFT:
      'Kế hoạch/Mission đã chốt. Cần điều chỉnh kế hoạch trước khi tiếp tục lập kế hoạch.',
  }
  // The original ApiError and plan.blockers retain codes/IDs for diagnostics.
  // Unknown server text is not copied into the product UI.
  return (
    advice[code.split(':', 1)[0]] ??
    'Chưa thể thực hiện thao tác. Vui lòng tải lại dữ liệu hoặc liên hệ hỗ trợ.'
  )
}

export function finalizeError(error: unknown): string {
  if (error instanceof ApiError && error.code) {
    return planningBlocker(error.code)
  }
  if (error instanceof ApiError && error.message) {
    return error.message
  }
  return 'Không thể chốt kế hoạch. Vui lòng thử lại.'
}

export function planningError(error: unknown): string {
  if (resourceAssignmentConflict(error))
    return planningBlocker('RESOURCE_TIME_CONFLICT')
  if (!(error instanceof ApiError))
    return 'Không thể kết nối. Giữ nguyên dữ liệu và thử lại sau.'
  return planningBlocker(error.code ?? '')
}

export function resourceAssignmentConflict(error: unknown): boolean {
  return (
    (error instanceof ApiError &&
      [
        'RESOURCE_TIME_CONFLICT',
        'RESOURCE_ALREADY_RESERVED',
        'SCHEDULE_CONFLICT',
      ].includes(error.code ?? '')) ||
    (error instanceof Error &&
      error.message === 'Resource is reserved during the requested interval')
  )
}
