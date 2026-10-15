import { defineMessages } from '../../../../shared/i18n'

export const orderReviewPageMessages = defineMessages({
  vi: {
    notReadyForApproval: (reasons: string | number | null | undefined) =>
      `Chưa đủ điều kiện duyệt: ${reasons}`,
  },
  en: {
    notReadyForApproval: (reasons: string | number | null | undefined) =>
      `Not ready for approval: ${reasons}`,
  },
})
