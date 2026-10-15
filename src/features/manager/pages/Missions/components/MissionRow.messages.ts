import { defineMessages } from '../../../../../shared/i18n'

export const missionRowMessages = defineMessages({
  vi: {
    view: 'Xem',
    continueSetup: 'Tiếp tục thiết lập',
    staffAccepted: (accepted: number, total: number) =>
      `${accepted}/${total} đã nhận`,
    attempt: (n: number) => `Lần ${n}`,
    deliveryStatus: {
      none: '—',
      approved: 'Kết quả đã duyệt',
      pendingApproval: 'Kết quả chờ duyệt',
      rejected: 'Kết quả bị từ chối',
      noResult: 'Chưa có kết quả',
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
    continueSetup: 'Continue setup',
    staffAccepted: (accepted: number, total: number) =>
      `${accepted}/${total} accepted`,
    attempt: (n: number) => `Attempt ${n}`,
    deliveryStatus: {
      none: '—',
      approved: 'Result approved',
      pendingApproval: 'Result awaiting approval',
      rejected: 'Result rejected',
      noResult: 'No result yet',
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
