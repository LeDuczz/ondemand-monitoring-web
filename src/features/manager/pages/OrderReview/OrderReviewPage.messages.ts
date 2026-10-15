import { defineMessages } from '../../../../shared/i18n'

export const orderReviewPageMessages = defineMessages({
  vi: {
    notReadyForApproval: (reasons: string | number | null | undefined) =>
      `Chưa đủ điều kiện duyệt: ${reasons}`,
    pageTitle: 'Đơn hàng',
    pageSubtitle:
      'Xem chi tiết đơn hàng và phê duyệt để tiếp tục lên lịch thực hiện',
  },
  en: {
    notReadyForApproval: (reasons: string | number | null | undefined) =>
      `Not ready for approval: ${reasons}`,
    pageTitle: 'Orders',
    pageSubtitle: 'Review the order details and approve to continue scheduling',
  },
})
