import { defineMessages } from '../../../shared/i18n'

export const customerFinancePanelMessages = defineMessages({
  vi: {
    loading: 'Đang tải báo giá...',
    title: 'Báo giá và thanh toán',
    subtitle: 'Giá được manager xác nhận theo phạm vi yêu cầu của đơn.',
    quoteVersion: (v: number) => `Báo giá v${v}`,
    noCheckoutUrl: 'Cổng thanh toán chưa trả về checkout URL.',
    providerError:
      'Không thể khởi tạo thanh toán VNPAY. Vui lòng kiểm tra cấu hình cổng thanh toán hoặc thử lại sau.',
    loadError: 'Không thể tải dữ liệu tài chính.',
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
  },
})
