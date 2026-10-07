import { defineMessages } from '../../../../../shared/i18n'

export const pricingEstimateMessages = defineMessages({
  vi: {
    title: 'Chi phí dự kiến',
    servicePrice: 'Giá gói cơ bản',
    aiAnalysis: 'AI phân tích hình ảnh',
    total: 'Tổng dự kiến',
    estimateNotice:
      'Đây là giá gói dự kiến. Việc thêm, sửa hoặc bỏ nội dung giám sát có thể làm thay đổi chi phí; manager sẽ review và gửi báo giá cuối cùng để bạn xác nhận trước khi thanh toán.',
    loading: 'Đang tính chi phí...',
    unavailable:
      'Chưa lấy được báo giá cho dịch vụ này. Chi phí sẽ được xác nhận khi duyệt.',
    pickService: 'Chọn dịch vụ để xem chi phí dự kiến.',
  },
  en: {
    title: 'Estimated cost',
    servicePrice: 'Base package price',
    aiAnalysis: 'AI image analysis',
    total: 'Estimated total',
    estimateNotice:
      'This is the estimated package price. Adding, editing, or removing monitoring requirements may change the cost; a manager will review them and send the final quote for your confirmation before payment.',
    loading: 'Calculating cost...',
    unavailable:
      'No quote is available for this service yet. The cost is confirmed on approval.',
    pickService: 'Select a service to see the estimated cost.',
  },
})
