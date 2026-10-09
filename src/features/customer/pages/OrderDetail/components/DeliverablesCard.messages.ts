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
      priority: 'Mức ưu tiên',
      usagePurpose: 'Mục đích sử dụng',
    } as Record<string, string>,
    mediaTypes: { IMAGE: 'Ảnh', VIDEO: 'Video' } as Record<string, string>,
    priorities: { NORMAL: 'Bình thường', HIGH: 'Cao', URGENT: 'Khẩn cấp' } as Record<string, string>,
    usagePurposes: {
      INTERNAL: 'Nội bộ',
      LEGAL: 'Pháp lý',
      PARTNER_REPORT: 'Báo cáo cho đối tác',
      OTHER: 'Khác',
    } as Record<string, string>,
    formats: { IMAGE: 'Ảnh', VIDEO: 'Video' } as Record<string, string>,
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
      priority: 'Priority',
      usagePurpose: 'Usage purpose',
    } as Record<string, string>,
    mediaTypes: { IMAGE: 'Photo', VIDEO: 'Video' } as Record<string, string>,
    priorities: { NORMAL: 'Normal', HIGH: 'High', URGENT: 'Urgent' } as Record<string, string>,
    usagePurposes: {
      INTERNAL: 'Internal',
      LEGAL: 'Legal',
      PARTNER_REPORT: 'Partner report',
      OTHER: 'Other',
    } as Record<string, string>,
    formats: { IMAGE: 'Photo', VIDEO: 'Video' } as Record<string, string>,
  },
})
