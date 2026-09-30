import { defineMessages } from '../../../../../shared/i18n'

export const pricingEstimateMessages = defineMessages({
  vi: {
    title: 'Chi phí dự kiến',
    servicePrice: 'Giá dịch vụ',
    aiAnalysis: 'AI phân tích hình ảnh',
    total: 'Tổng dự kiến',
    loading: 'Đang tính chi phí...',
    unavailable: 'Chưa lấy được báo giá cho dịch vụ này. Chi phí sẽ được xác nhận khi duyệt.',
    pickService: 'Chọn dịch vụ để xem chi phí dự kiến.',
  },
  en: {
    title: 'Estimated cost',
    servicePrice: 'Service price',
    aiAnalysis: 'AI image analysis',
    total: 'Estimated total',
    loading: 'Calculating cost...',
    unavailable: 'No quote is available for this service yet. The cost is confirmed on approval.',
    pickService: 'Select a service to see the estimated cost.',
  },
})
