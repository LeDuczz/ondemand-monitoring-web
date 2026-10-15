import { defineMessages } from '../../../../../shared/i18n'

export const missionRowMessages = defineMessages({
  vi: {
    view: 'Xem',
    continueSetup: 'Tiếp tục thiết lập',
    deliveryStatus: {
      none: '—',
      processing: 'Chờ duyệt kết quả',
      readyForPreview: 'Chờ gửi preview',
      customerReview: 'Customer đang xem',
      revisionRequested: 'Customer yêu cầu sửa',
      finalPaymentPending: 'Chờ thanh toán cuối',
      readyForDelivery: 'Chờ giao bản gốc',
      delivered: 'Đã bàn giao',
      loading: 'Đang kiểm tra...',
    },
    openTheOrderPlanOf: (a0: string | number | null | undefined) =>
      `Mở kế hoạch Order của ${a0}`,
    openOrderPlan: 'Mở kế hoạch Order',
  },
  en: {
    view: 'View',
    continueSetup: 'Continue setup →',
    deliveryStatus: {
      none: '—',
      processing: 'Awaiting result approval',
      readyForPreview: 'Ready to send preview',
      customerReview: 'Customer reviewing',
      revisionRequested: 'Revision requested',
      finalPaymentPending: 'Awaiting final payment',
      readyForDelivery: 'Ready to release originals',
      delivered: 'Delivered',
      loading: 'Checking...',
    },
    openTheOrderPlanOf: (a0: string | number | null | undefined) =>
      `Open the Order plan of ${a0}`,
    openOrderPlan: 'Open Order plan',
  },
})
