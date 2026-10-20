import { defineMessages } from '../../../../../shared/i18n'

export const areaManagerReviewMessages = defineMessages({
  vi: {
    heading: 'Đánh giá của Manager',
    reasonLabel: 'Lý do:',
    noteLabel: 'Ghi chú:',
    defaultReviewer: 'Manager',
    editReview: 'Chỉnh sửa đánh giá',
    askCustomerChange: 'Yêu cầu khách đổi khu vực',
    rejectOrder: 'Từ chối đơn hàng',
    noReview: 'Chưa có đánh giá của Manager.',
    reviewArea: 'Đánh giá khu vực',
    needHelp: 'Cần trợ giúp? Liên hệ hỗ trợ',
    contactCustomer: 'Liên hệ khách hàng:',
    noPhone: 'Chưa có số điện thoại',
    confirmAskCustomerChangeTitle: 'Yêu cầu khách đổi khu vực?',
    confirmAskCustomerChangeBody:
      'Đơn sẽ được chuyển về cho khách để chọn lại khu vực giám sát. Bạn nên gọi báo trước cho khách.',
    askCustomerChangeAction: 'Yêu cầu đổi khu vực',
    confirmRejectTitle: 'Từ chối đơn hàng?',
    confirmRejectBody:
      'Đơn sẽ bị từ chối và đóng lại. Bạn nên gọi báo cho khách trước khi từ chối.',
    rejectOrderAction: 'Từ chối đơn',
    statusLabels: {
      NOT_REVIEWED: 'Chưa đánh giá',
      NOT_REQUIRED: 'Khu vực phù hợp sơ bộ',
      PENDING_PERMIT: 'Chờ xử lý giấy phép',
      APPROVED: 'Khu vực đã được xác nhận',
      REJECTED: 'Khu vực không khả thi',
    } as Record<string, string>,
  },
  en: {
    heading: 'Manager review',
    reasonLabel: 'Reason:',
    noteLabel: 'Note:',
    defaultReviewer: 'Manager',
    editReview: 'Edit review',
    askCustomerChange: 'Ask the customer to change the area',
    rejectOrder: 'Reject the order',
    noReview: 'No Manager review yet.',
    reviewArea: 'Review the area',
    needHelp: 'Need help? Contact support',
    contactCustomer: 'Contact the customer:',
    noPhone: 'No phone number on file',
    confirmAskCustomerChangeTitle: 'Ask the customer to change the area?',
    confirmAskCustomerChangeBody:
      'The order goes back to the customer to pick the monitoring area again. You should call the customer first.',
    askCustomerChangeAction: 'Ask to change area',
    confirmRejectTitle: 'Reject the order?',
    confirmRejectBody:
      'The order will be rejected and closed. You should call the customer before rejecting.',
    rejectOrderAction: 'Reject order',
    statusLabels: {
      NOT_REVIEWED: 'Not reviewed',
      NOT_REQUIRED: 'Area preliminarily suitable',
      PENDING_PERMIT: 'Permit pending',
      APPROVED: 'Area confirmed',
      REJECTED: 'Area not feasible',
    } as Record<string, string>,
  },
})
