import { defineMessages } from '../../../../../shared/i18n'

export const pricingEstimateMessages = defineMessages({
  vi: {
    title: 'Chi phí dự kiến',
    servicePrice: 'Nội dung giám sát',
    aiAnalysis: 'AI phân tích hình ảnh',
    total: 'Tổng dự kiến',
    additionalServiceRow: 'Dịch vụ bổ sung',
    additionalPending: (count: number) =>
      count > 1 ? `${count} nội dung · Chờ Manager duyệt báo giá` : 'Chờ Manager duyệt báo giá',
    estimateNotice:
      'Đây là chi phí dự kiến. Việc thêm, sửa hoặc bỏ nội dung giám sát có thể làm thay đổi chi phí; manager sẽ review và gửi báo giá cuối cùng để bạn xác nhận trước khi thanh toán.',
    loading: 'Đang tính chi phí...',
    unavailable:
      'Chưa lấy được báo giá cho dịch vụ này. Chi phí sẽ được xác nhận khi duyệt.',
    pickService: 'Chọn dịch vụ để xem chi phí dự kiến.',
    additionalServices: 'DỊCH VỤ BỔ SUNG',
    mediaCounts: (images: number, videos: number) => `${images} ảnh · ${videos} video`,
    awaitingManagerQuote: 'Đang chờ Manager duyệt báo giá',
    quotePending:
      'Báo giá dự kiến chưa bao gồm dịch vụ bổ sung. Manager sẽ xem xét các yêu cầu ngoài gói và gửi báo giá cuối cùng để bạn xác nhận trước khi thanh toán.',
  },
  en: {
    title: 'Estimated cost',
    servicePrice: 'Monitoring content',
    aiAnalysis: 'AI image analysis',
    total: 'Estimated total',
    additionalServiceRow: 'Additional services',
    additionalPending: (count: number) =>
      count > 1 ? `${count} items · Waiting for Manager quote approval` : 'Waiting for Manager quote approval',
    estimateNotice:
      'This is the estimated cost. Adding, editing, or removing monitoring requirements may change the cost; a manager will review them and send the final quote for your confirmation before payment.',
    loading: 'Calculating cost...',
    unavailable:
      'No quote is available for this service yet. The cost is confirmed on approval.',
    pickService: 'Select a service to see the estimated cost.',
    additionalServices: 'ADDITIONAL SERVICES',
    mediaCounts: (images: number, videos: number) => `${images} images · ${videos} videos`,
    awaitingManagerQuote: 'Waiting for Manager quote approval',
    quotePending:
      'This estimate excludes additional services. A manager will review out-of-package requests and send the final quote for your confirmation before payment.',
  },
})
