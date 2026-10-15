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
    confirmAskCustomerChange: 'Xác nhận yêu cầu khách đổi khu vực?',
    confirmRejectOrder: 'Xác nhận từ chối đơn hàng?',
    statusLabels: {
      PRELIMINARY_PASS: 'Đạt sơ bộ',
      RESTRICTED: 'Cần xử lý/giấy phép',
      UNSUITABLE: 'Không phù hợp',
      UNDETERMINED: 'Chưa xác định',
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
    confirmAskCustomerChange: 'Ask the customer to change the area?',
    confirmRejectOrder: 'Reject this order?',
    statusLabels: {
      PRELIMINARY_PASS: 'Preliminary pass',
      RESTRICTED: 'Needs handling/permit',
      UNSUITABLE: 'Unsuitable',
      UNDETERMINED: 'Undetermined',
    },
  },
})
