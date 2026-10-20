import { defineMessages } from '../../../../shared/i18n'

export const priceBreakdownMessages = defineMessages({
  vi: {
    systemPrice: 'Giá hệ thống',
    adjustment: 'Điều chỉnh',
    quoteTotal: 'Tổng báo giá',
    pendingHint: (n: number) =>
      `Còn ${n} nội dung cần xem xét trước khi duyệt.`,
    reasonLabel: 'Lý do điều chỉnh giá',
    reasonRequired: (min: number) => `bắt buộc, ít nhất ${min} ký tự`,
    reasonCount: (n: number, min: number) => `${n}/${min} ký tự tối thiểu`,
    noteLabel: 'Ghi chú báo giá (tùy chọn)',
    notePlaceholder: 'Thêm ghi chú cho báo giá...',
  },
  en: {
    systemPrice: 'System price',
    adjustment: 'Adjustment',
    quoteTotal: 'Quote total',
    pendingHint: (n: number) => `${n} item(s) need review before approval.`,
    reasonLabel: 'Price adjustment reason',
    reasonRequired: (min: number) => `required, at least ${min} characters`,
    reasonCount: (n: number, min: number) => `${n}/${min} characters minimum`,
    noteLabel: 'Quote note (optional)',
    notePlaceholder: 'Add a note to the quote...',
  },
})
