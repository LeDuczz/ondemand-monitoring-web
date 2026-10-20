import { defineMessages } from '../../../shared/i18n'

export const managerPricingPanelMessages = defineMessages({
  vi: {
    title: 'Xem xét yêu cầu và báo giá',
    subtitle: 'Mỗi yêu cầu phải được phân loại trước khi duyệt báo giá.',
    summaryTitle: 'Tóm tắt báo giá',
    policyVersion: (v?: number) => `Chính sách giá v${v ?? '—'}`,
    loadingPricing: 'Đang tải thông tin giá...',
    loadingQuote: 'Đang tải báo giá...',
    approveSuccess:
      'Duyệt báo giá thành công. Báo giá đã sẵn sàng để khách hàng chấp nhận.',
    pendingCustom: (n: number) =>
      `Còn ${n} yêu cầu bổ sung của khách hàng chưa được phân loại.`,
    outOfRange: (n: number) =>
      `Còn ${n} mục có giá duyệt ngoài khoảng cho phép. Sửa các mục báo đỏ rồi duyệt lại.`,
    reasonRequired: 'Vui lòng nhập lý do điều chỉnh giá.',
    reasonTooShort: (min: number, length: number) =>
      `Lý do điều chỉnh cần ít nhất ${min} ký tự (hiện có ${length}).`,
    genericError: 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
    errors: {
      ORDER_CHECKLIST_REVIEW_INVALID:
        'Danh sách yêu cầu chưa được xem xét đầy đủ. Hãy phân loại tất cả nội dung trước khi duyệt báo giá.',
      STALE_PRICING_POLICY:
        'Chính sách giá vừa được cập nhật. Giá trên màn hình đã được tải lại, vui lòng kiểm tra rồi duyệt lại.',
      STALE_PRICING_REVISION:
        'Báo giá đã được cập nhật ở nơi khác. Vui lòng tải lại dữ liệu.',
      PRICING_ADJUSTMENT_REASON_REQUIRED:
        'Lý do điều chỉnh giá cần ít nhất 10 ký tự.',
      PRICING_SELF_APPROVAL_NOT_ALLOWED:
        'Người đề xuất không thể tự phê duyệt điều chỉnh giá.',
      PRICE_BELOW_ALLOWED_MINIMUM:
        'Giá sau điều chỉnh thấp hơn mức giá sàn cho phép.',
      ZERO_PRICE_NOT_ALLOWED: 'Giá báo không được bằng 0.',
      QUOTE_HAS_UNAPPROVED_PRICING: 'Điều chỉnh giá chưa được phê duyệt.',
      QUOTE_NOT_CURRENT: 'Báo giá này không còn là phiên bản hiện hành.',
      CONCURRENT_UPDATE:
        'Dữ liệu vừa được cập nhật. Vui lòng tải lại và thử lại.',
    } as Record<string, string>,
    errorExceedsLimit: 'Mức điều chỉnh vượt quá giới hạn cho phép.',
    errorReviewIncomplete: (detail?: string) =>
      `Đơn chưa đủ điều kiện duyệt${detail ? `: ${detail}` : '.'}`,
    errorPricingInvalid: (detail?: string) =>
      `Dữ liệu giá không hợp lệ${detail ? `: ${detail}` : '.'}`,
    errorUnknown: (detail?: string, code?: string) =>
      `Không thể xử lý yêu cầu định giá${detail ? `: ${detail}` : ''}${
        code ? ` (${code})` : ''
      }. Vui lòng thử lại.`,
  },
  en: {
    title: 'Review requirements and quote',
    subtitle:
      'Every requirement must be classified before the quote is approved.',
    summaryTitle: 'Quote summary',
    policyVersion: (v?: number) => `Pricing policy v${v ?? '—'}`,
    loadingPricing: 'Loading pricing information...',
    loadingQuote: 'Loading quote...',
    approveSuccess:
      'Quote approved. It is now ready for the customer to accept.',
    pendingCustom: (n: number) =>
      `${n} customer-added requirement(s) have not been classified yet.`,
    outOfRange: (n: number) =>
      `${n} item(s) have an approved price outside the allowed range. Fix the items marked in red and approve again.`,
    reasonRequired: 'Please enter the reason for the price adjustment.',
    reasonTooShort: (min: number, length: number) =>
      `The adjustment reason needs at least ${min} characters (currently ${length}).`,
    genericError: 'Could not process the request. Please try again.',
    errors: {
      ORDER_CHECKLIST_REVIEW_INVALID:
        'The requirement list has not been fully reviewed. Classify every item before approving the quote.',
      STALE_PRICING_POLICY:
        'The pricing policy was just updated. The prices on screen have been reloaded, please check and approve again.',
      STALE_PRICING_REVISION:
        'The quote was updated elsewhere. Please reload the data.',
      PRICING_ADJUSTMENT_REASON_REQUIRED:
        'The price adjustment reason needs at least 10 characters.',
      PRICING_SELF_APPROVAL_NOT_ALLOWED:
        'The proposer cannot approve their own price adjustment.',
      PRICE_BELOW_ALLOWED_MINIMUM:
        'The adjusted price is below the allowed minimum.',
      ZERO_PRICE_NOT_ALLOWED: 'The quoted price cannot be zero.',
      QUOTE_HAS_UNAPPROVED_PRICING: 'The price adjustment is not approved yet.',
      QUOTE_NOT_CURRENT: 'This quote is no longer the current version.',
      CONCURRENT_UPDATE: 'The data was just updated. Reload and try again.',
    } as Record<string, string>,
    errorExceedsLimit: 'The adjustment exceeds the allowed limit.',
    errorReviewIncomplete: (detail?: string) =>
      `The order is not ready to be approved${detail ? `: ${detail}` : '.'}`,
    errorPricingInvalid: (detail?: string) =>
      `The pricing data is invalid${detail ? `: ${detail}` : '.'}`,
    errorUnknown: (detail?: string, code?: string) =>
      `Could not process the pricing request${detail ? `: ${detail}` : ''}${
        code ? ` (${code})` : ''
      }. Please try again.`,
  },
})
