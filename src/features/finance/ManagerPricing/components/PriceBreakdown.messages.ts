import { defineMessages } from '../../../../shared/i18n'

export const priceBreakdownMessages = defineMessages({
  vi: {
    packagePrice: 'Giá gói',
    additionalCost: 'Chi phí bổ sung',
    discount: 'Giảm giá',
    adjustment: 'Điều chỉnh',
    quoteTotal: 'Tổng báo giá',
    pendingHint: (n: number) => `Còn ${n} nội dung cần review trước khi duyệt.`,
    adjustQuote: 'Điều chỉnh báo giá',
    adjustmentSigned: 'Điều chỉnh (+/-)',
    vnd: 'VND',
    noteLabel: 'Ghi chú báo giá (tùy chọn)',
    notePlaceholder: 'Thêm ghi chú cho báo giá...',
  },
  en: {
    packagePrice: 'Package price',
    additionalCost: 'Additional cost',
    discount: 'Discount',
    adjustment: 'Adjustment',
    quoteTotal: 'Quote total',
    pendingHint: (n: number) => `${n} item(s) need review before approval.`,
    adjustQuote: 'Adjust quote',
    adjustmentSigned: 'Adjustment (+/-)',
    vnd: 'VND',
    noteLabel: 'Quote note (optional)',
    notePlaceholder: 'Add a note to the quote...',
  },
})
