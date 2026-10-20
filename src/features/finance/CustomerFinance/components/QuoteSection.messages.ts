import { defineMessages } from '../../../../shared/i18n'

export const quoteSectionMessages = defineMessages({
  vi: {
    estimatedCost: 'Chi phí dự kiến',
    additionalServices: 'Dịch vụ bổ sung',
    orderTotal: 'Tổng đơn hàng',
    estimateNotice: 'Báo giá dự kiến chưa bao gồm dịch vụ theo yêu cầu.',
    rejectedTitle: 'Đơn hàng không thể thực hiện',
    rejectedBody: 'Đơn hàng không thể thực hiện do điều kiện khu vực bay.',
    verifyingTitle: 'Đang xác minh điều kiện khu vực bay',
    verifyingBody:
      'Chúng tôi đang xác minh các điều kiện cần thiết trước khi đơn hàng có thể tiếp tục.',
    permitTitle: 'Đang xác minh giấy phép bay',
    permitBody:
      'Bạn vẫn có thể tiếp tục. Chúng tôi sẽ cập nhật khi giấy phép được xác nhận.',
    approvedAdjustment: 'Điều chỉnh đã được phê duyệt',
    content: 'Nội dung',
    orderLevel: 'Theo đơn hàng',
    accept: 'Chấp nhận báo giá',
  },
  en: {
    estimatedCost: 'Estimated cost',
    additionalServices: 'Additional services',
    orderTotal: 'Order total',
    estimateNotice: 'The estimated quote does not include on-request services.',
    rejectedTitle: 'The order cannot be carried out',
    rejectedBody:
      'The order cannot be carried out because of the flight area conditions.',
    verifyingTitle: 'Verifying flight area conditions',
    verifyingBody:
      'We are verifying the required conditions before the order can continue.',
    permitTitle: 'Verifying the flight permit',
    permitBody:
      'You can still continue. We will update you once the permit is confirmed.',
    approvedAdjustment: 'Approved adjustment',
    content: 'Item',
    orderLevel: 'Order level',
    accept: 'Accept quote',
  },
})
