import { defineMessages } from '../../../shared/i18n'

export const planningErrorMessages = defineMessages({
  vi: {
    advice: {
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
    } as Record<string, string>,
    unknown:
      'Chưa thể thực hiện thao tác. Vui lòng tải lại dữ liệu hoặc liên hệ hỗ trợ.',
    finalizeFailed: 'Không thể chốt kế hoạch. Vui lòng thử lại.',
    offline: 'Không thể kết nối. Giữ nguyên dữ liệu và thử lại sau.',
  },
  en: {
    advice: {
      ORDER_NOT_APPROVED:
        'The order is not in a state that allows the plan to be finalized.',
      INVOICE_NOT_PAYABLE:
        'The customer must accept the quote before a Mission can be created.',
      FINAL_PAYMENT_REQUIRED:
        'The customer must pay in full before receiving the originals.',
      DELIVERABLE_NOT_RELEASED:
        'The originals have not been delivered to the customer yet.',
      NO_EFFECTIVE_MISSIONS:
        'Add at least one Mission to the plan before finalizing.',
      CHECKLIST_ASSIGNMENT_NOT_FINALIZED:
        'The checklist assignment has not been finalized.',
      CHECKLIST_EXECUTION_INTEGRITY_INVALID:
        'The checklist assignment must be reviewed again before finalizing.',
      MULTI_MISSION_LEGACY_ORDER_NOT_MIGRATED:
        'The legacy plan must be reviewed before continuing.',
      INVALID_REQUEST:
        'The information is not valid. Please check and try again.',
      ACCESS_DENIED: 'You do not have permission to perform this action.',
      UNAUTHORIZED: 'Please sign in again to continue.',
      EXECUTION_PLAN_REVISION_CONFLICT:
        'The plan was changed in another session. Please reload the data.',
      CHECKLIST_COVERAGE_INCOMPLETE:
        'Some checklist items are not assigned yet. Check the requirements before finalizing the plan.',
      MISSION_CANCELLATION_REQUIRES_SAFE_STOP:
        'The Mission cannot be cancelled yet. Complete the safety confirmation and close the operation session before cancelling.',
      MISSION_SAFE_STOP_NOT_READY:
        'The Mission is not in a safe state to continue. Refresh the status or wait for the operator.',
      MISSION_SAFE_STOP_FAILED:
        'The safe stop did not complete. Refresh the status and contact the operator.',
      MISSION_RESULT_ALREADY_APPROVED:
        'The result has already been approved; the history of this Mission cannot be cancelled.',
      RESOURCE_TIME_CONFLICT:
        'The resource has a schedule conflict. Choose another resource or time and reload the available list.',
      RESOURCE_ALREADY_RESERVED:
        'The resource is already reserved. Reload the available list and choose another resource.',
      SCHEDULE_CONFLICT:
        'The resource schedule conflicts. Reload the available list and choose another schedule.',
      EXECUTION_PLAN_NOT_DRAFT:
        'The plan/Mission is already finalized. Adjust the plan before continuing to plan.',
    } as Record<string, string>,
    unknown:
      'The action could not be completed. Please reload the data or contact support.',
    finalizeFailed: 'Could not finalize the plan. Please try again.',
    offline: 'Unable to connect. Your data is kept; please try again later.',
  },
})
