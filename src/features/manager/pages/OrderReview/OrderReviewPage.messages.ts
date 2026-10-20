import { defineMessages } from '../../../../shared/i18n'

export const orderReviewPageMessages = defineMessages({
  vi: {
    readonlyTitle: 'Bạn đang xem lại bước đã hoàn thành',
    readonlyBody: 'Thông tin này đã được xác nhận và hiện chỉ có thể xem.',
    readonlyBack: 'Quay lại bước hiện tại',
    finalizePlan: 'Hoàn tất phân công',
    notReadyForApproval: (reasons: string | number | null | undefined) =>
      `Chưa đủ điều kiện duyệt: ${reasons}`,
  },
  en: {
    readonlyTitle: 'You are reviewing a completed step',
    readonlyBody: 'This information is confirmed and is now view-only.',
    readonlyBack: 'Back to the current step',
    finalizePlan: 'Finish assignment',
    notReadyForApproval: (reasons: string | number | null | undefined) =>
      `Not ready for approval: ${reasons}`,
  },
})
