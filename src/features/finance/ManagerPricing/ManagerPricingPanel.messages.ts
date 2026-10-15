import { defineMessages } from '../../../shared/i18n'

export const managerPricingPanelMessages = defineMessages({
  vi: {
    title: 'Review yêu cầu và báo giá',
    subtitle: 'Mỗi yêu cầu phải được phân loại trước khi duyệt báo giá.',
    summaryTitle: 'Tóm tắt báo giá',
    loadingPricing: 'Đang tải thông tin giá...',
    loadingQuote: 'Đang tải báo giá...',
    draftSaved: 'Đã lưu báo giá nháp.',
    approveSuccess:
      'Duyệt báo giá thành công. Báo giá đã sẵn sàng để khách hàng chấp nhận.',
    pendingCustom: (n: number) =>
      `Còn ${n} yêu cầu bổ sung của khách hàng chưa được phân loại.`,
    checklistInvalid:
      'Checklist chưa được review đầy đủ. Hãy phân loại tất cả nội dung trước khi duyệt báo giá.',
    genericError: 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
  },
  en: {
    title: 'Review requirements and quote',
    subtitle:
      'Every requirement must be classified before the quote is approved.',
    summaryTitle: 'Quote summary',
    loadingPricing: 'Loading pricing information...',
    loadingQuote: 'Loading quote...',
    draftSaved: 'Draft quote saved.',
    approveSuccess:
      'Quote approved. It is now ready for the customer to accept.',
    pendingCustom: (n: number) =>
      `${n} customer-added requirement(s) have not been classified yet.`,
    checklistInvalid:
      'The checklist has not been fully reviewed. Classify every item before approving the quote.',
    genericError: 'Could not process the request. Please try again.',
  },
})
