import { defineMessages } from '../../../../../shared/i18n'

export const orderDeliverablesMessages = defineMessages({
  vi: {
    title: 'Kết quả bàn giao',
    empty: 'Đơn này chưa có kết quả bàn giao nào.',
    format: 'Định dạng',
    aiAnalysis: 'Có phân tích ảnh bằng AI',
    keys: {
      mediaType: 'Loại',
      quantity: 'Số lượng',
      resolution: 'Độ phân giải',
      radiusM: 'Bán kính (m)',
      estimatedAreaHa: 'Diện tích ước tính (ha)',
    } as Record<string, string>,
    mediaTypes: { IMAGE: 'Ảnh', VIDEO: 'Video' } as Record<string, string>,
  },
  en: {
    title: 'Deliverables',
    empty: 'This order has no deliverables yet.',
    format: 'Format',
    aiAnalysis: 'Includes AI image analysis',
    keys: {
      mediaType: 'Type',
      quantity: 'Quantity',
      resolution: 'Resolution',
      radiusM: 'Radius (m)',
      estimatedAreaHa: 'Estimated area (ha)',
    } as Record<string, string>,
    mediaTypes: { IMAGE: 'Photo', VIDEO: 'Video' } as Record<string, string>,
  },
})
