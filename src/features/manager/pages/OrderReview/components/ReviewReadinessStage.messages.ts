import { defineMessages } from '../../../../../shared/i18n'

export const reviewReadinessStageMessages = defineMessages({
  vi: {
    approvalConditions: 'Điều kiện duyệt',
    nextChecklistQuote: 'Tiếp: Checklist & báo giá',
    conMucBatBuocChua: (a0: string | number | null | undefined) =>
      `Còn ${a0} mục bắt buộc chưa xác nhận — chưa thể duyệt báo giá`,
  },
  en: {
    approvalConditions: 'Approval conditions',
    nextChecklistQuote: 'Next: Checklist & quote',
    conMucBatBuocChua: (a0: string | number | null | undefined) =>
      Number(a0) === 1
        ? '1 required item is not confirmed yet — the quote cannot be approved'
        : `${a0} required items are not confirmed yet — the quote cannot be approved`,
  },
})
