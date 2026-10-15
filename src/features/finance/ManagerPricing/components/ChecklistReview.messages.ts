import { defineMessages } from '../../../../shared/i18n'

export const checklistReviewMessages = defineMessages({
  vi: {
    reviewedOf: (done: number, all: number) =>
      `${done}/${all} nội dung đã review`,
    filterAria: 'Lọc nội dung',
    filterAll: 'Tất cả',
    filterPending: 'Chưa review',
    filterReviewed: 'Đã review',
    filterAdditional: 'Có phụ phí',
    complete: 'Checklist đã hoàn tất và có thể duyệt báo giá.',
    pending: (n: number) =>
      `Còn ${n} nội dung cần chọn cách tính giá trước khi duyệt.`,
    colContent: 'Nội dung yêu cầu',
    colMethod: 'Cách tính giá',
    colSurcharge: 'Phụ phí',
    colStatus: 'Trạng thái',
    colNote: 'Ghi chú',
  },
  en: {
    reviewedOf: (done: number, all: number) => `${done}/${all} items reviewed`,
    filterAria: 'Filter items',
    filterAll: 'All',
    filterPending: 'Not reviewed',
    filterReviewed: 'Reviewed',
    filterAdditional: 'Surcharged',
    complete: 'The checklist is complete and the quote can be approved.',
    pending: (n: number) =>
      `${n} item(s) still need a pricing method before approval.`,
    colContent: 'Requirement',
    colMethod: 'Pricing method',
    colSurcharge: 'Surcharge',
    colStatus: 'Status',
    colNote: 'Note',
  },
})
