import { defineMessages } from '../../../shared/i18n'

export const customerFinancePanelMessages = defineMessages({
  vi: {
    loading: 'Đang tải báo giá...',
    title: 'Báo giá và thanh toán',
    subtitle: 'Giá được manager xác nhận theo phạm vi yêu cầu của đơn.',
    quoteVersion: (v: number) => `Báo giá v${v}`,
    noCheckoutUrl: 'Cổng thanh toán chưa trả về đường dẫn thanh toán.',
    providerError:
      'Không thể khởi tạo thanh toán VNPAY. Vui lòng kiểm tra cấu hình cổng thanh toán hoặc thử lại sau.',
    loadError: 'Không thể tải dữ liệu tài chính.',
    networkError: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
    errors: {
      INVOICE_ALREADY_PAID: 'Hóa đơn này đã được thanh toán đầy đủ.',
      INVOICE_NOT_PAYABLE: 'Hóa đơn hiện không thể thanh toán.',
      DEPOSIT_ALREADY_SATISFIED: 'Khoản đặt cọc đã được thanh toán.',
      ACTIVE_PAYMENT_EXISTS: 'Đang có một giao dịch thanh toán chưa hoàn tất.',
      QUOTE_NOT_APPROVED: 'Báo giá chưa được phê duyệt.',
      QUOTE_NOT_CURRENT: 'Báo giá này không còn là phiên bản hiện hành.',
    } as Record<string, string>,
  },
  en: {
    loading: 'Loading quote...',
    title: 'Quote and payment',
    subtitle: "The price is confirmed by the manager for the order's scope.",
    quoteVersion: (v: number) => `Quote v${v}`,
    noCheckoutUrl: 'The payment gateway did not return a checkout URL.',
    providerError:
      'Could not start the VNPAY payment. Please check the payment gateway configuration or try again later.',
    loadError: 'Could not load financial data.',
    networkError: 'Unable to reach the server. Please try again.',
    errors: {
      INVOICE_ALREADY_PAID: 'This invoice has already been paid in full.',
      INVOICE_NOT_PAYABLE: 'This invoice cannot be paid right now.',
      DEPOSIT_ALREADY_SATISFIED: 'The deposit has already been paid.',
      ACTIVE_PAYMENT_EXISTS: 'A payment is already in progress.',
      QUOTE_NOT_APPROVED: 'The quote has not been approved yet.',
      QUOTE_NOT_CURRENT: 'This quote is no longer the current version.',
    } as Record<string, string>,
  },
})
