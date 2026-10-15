import { defineMessages } from '../../../../../shared/i18n'

export const decisionModalMessages = defineMessages({
  vi: {
    rejectReasonChips: [
      'Vùng cấm bay',
      'Thiếu nguồn lực',
      'Thông tin chưa rõ ràng',
      'Ngoài phạm vi dịch vụ',
    ],
    infoReasonChips: [
      'Cần mặt bằng chi tiết',
      'Cần xác nhận quyền sử dụng đất',
      'Cần rõ khung giờ',
    ],
    reasonRequired: 'Lý do là bắt buộc',
    submitFailed: 'Gửi thất bại, thử lại.',
    rejectModalTitle: (code: string) => `Từ chối đơn ${code}`,
    infoModalTitle: 'Yêu cầu khách bổ sung thông tin',
    rejectModalHint:
      'Khách sẽ nhận thông báo kèm lý do. Đơn chuyển sang REJECTED.',
    infoModalHint:
      'Đơn quay lại trạng thái cần chỉnh sửa (decision NEED_INFO).',
    close: 'Đóng',
    reasonLabel: 'Lý do (bắt buộc)',
    reasonPlaceholder: 'Khách hàng sẽ nhìn thấy nội dung này',
    reasonSavedHint: 'Lưu vào order_approval.reason',
    cancel: 'Huỷ',
    confirmReject: 'Xác nhận từ chối',
    sendRequest: 'Gửi yêu cầu',
  },
  en: {
    rejectReasonChips: [
      'No-fly zone',
      'Missing resources',
      'Unclear information',
      'Outside service coverage',
    ],
    infoReasonChips: [
      'Needs detailed site plan',
      'Needs proof of land-use rights',
      'Needs a clearer time window',
    ],
    reasonRequired: 'A reason is required',
    submitFailed: 'Submitting failed, try again.',
    rejectModalTitle: (code: string) => `Reject order ${code}`,
    infoModalTitle: 'Request more information from the customer',
    rejectModalHint:
      'The customer will be notified with the reason. The order moves to REJECTED.',
    infoModalHint: 'The order goes back to needs-changes (decision NEED_INFO).',
    close: 'Close',
    reasonLabel: 'Reason (required)',
    reasonPlaceholder: 'The customer will see this text',
    reasonSavedHint: 'Saved to order_approval.reason',
    cancel: 'Cancel',
    confirmReject: 'Confirm reject',
    sendRequest: 'Send request',
  },
})
