import { defineMessages } from '../../../../../shared/i18n'

export const planningWorkspaceViewMessages = defineMessages({
  vi: {
    orderMissionPlanning: 'Order Mission planning',
    reloadPlan: 'Tải lại kế hoạch',
    loadingPlan: 'Đang tải kế hoạch…',
    depositWaitingTitle: 'Đang chờ khách hàng thanh toán đặt cọc',
    depositWaitingBody:
      'Báo giá đã được gửi. Tạo Mission và chốt kế hoạch sẽ được mở sau khi hệ thống xác nhận khoản đặt cọc.',
    depositProgress: (paid: number, deposit: number, locale: string) =>
      `Đã thanh toán ${paid.toLocaleString(locale)} / ${deposit.toLocaleString(locale)} ₫ tiền đặt cọc`,
    noInvoice: 'Khách hàng chưa chấp nhận báo giá hoặc chưa phát hành hóa đơn.',
    checkPayment: 'Kiểm tra thanh toán',
    thayDoiChuaLuuDuoc:
      'Thay đổi chưa lưu được giữ riêng theo Mission. Lưu phân công trước khi chốt hoặc điều chỉnh kế hoạch.',
  },
  en: {
    orderMissionPlanning: 'Order Mission planning',
    reloadPlan: 'Reload plan',
    loadingPlan: 'Loading plan…',
    depositWaitingTitle: 'Waiting for the customer to pay the deposit',
    depositWaitingBody:
      'The quote was sent. Creating Missions and finalizing the plan unlock once the system confirms the deposit.',
    depositProgress: (paid: number, deposit: number, locale: string) =>
      `Paid ${paid.toLocaleString(locale)} / ${deposit.toLocaleString(locale)} ₫ deposit`,
    noInvoice:
      'The customer has not accepted the quote or no invoice has been issued yet.',
    checkPayment: 'Check payment',
    thayDoiChuaLuuDuoc:
      'Unsaved changes are kept per Mission. Save assignments before finalizing or adjusting the plan.',
  },
})
