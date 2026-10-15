import { defineMessages } from '../../../../../shared/i18n'

export const orderReadinessCardMessages = defineMessages({
  vi: {
    couldNotSavePleaseTry: 'Không lưu được. Vui lòng thử lại.',
    approvalConditions: 'Điều kiện duyệt',
    failedReasonsRequired:
      'Vui lòng nhập lý do cho tất cả tiêu chí không đạt trước khi tiếp tục.',
    decisionFailed: 'Không gửi được quyết định.',
  },
  en: {
    couldNotSavePleaseTry: 'Could not save. Please try again.',
    approvalConditions: 'Approval conditions',
    failedReasonsRequired:
      'Please enter a reason for every failed criterion before continuing.',
    decisionFailed: 'Could not submit the decision.',
  },
})
