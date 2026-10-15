import { defineMessages } from '../../../../shared/i18n'
import type {
  CriterionResult,
  ReadinessRecommendation,
} from '../../types/readiness'

type Answer = Exclude<CriterionResult, 'PENDING'>

export const readinessLabelsMessages = defineMessages({
  vi: {
    resultLabel: {
      PASS: 'Đạt',
      WARN: 'Cần xem xét',
      FAIL: 'Không đạt',
      PENDING: 'Chưa xét',
    } as Record<CriterionResult, string>,
    recommendationText: {
      COMPLETE_REVIEW: 'Hoàn tất các mục manager cần xác nhận',
      REQUEST_INFO_OR_REJECT:
        'Có tiêu chí bắt buộc không đạt: yêu cầu bổ sung hoặc từ chối',
      APPROVE_WITH_NOTES: 'Có thể duyệt, nhưng cần liên hệ xác minh',
      APPROVE: 'Đủ điều kiện duyệt',
    } as Record<ReadinessRecommendation, string>,
    contextualAnswerLabels: {
      RISK_LEVEL: { PASS: 'Thấp', WARN: 'Trung bình', FAIL: 'Cao' },
    } as Record<string, Record<Answer, string>>,
  },
  en: {
    resultLabel: {
      PASS: 'Pass',
      WARN: 'Needs review',
      FAIL: 'Fail',
      PENDING: 'Not reviewed',
    },
    recommendationText: {
      COMPLETE_REVIEW: 'Complete the items the manager must confirm',
      REQUEST_INFO_OR_REJECT:
        'A required criterion failed: request more information or reject',
      APPROVE_WITH_NOTES: 'Can be approved, but contact the customer to verify',
      APPROVE: 'Eligible for approval',
    },
    contextualAnswerLabels: {
      RISK_LEVEL: { PASS: 'Low', WARN: 'Medium', FAIL: 'High' },
    },
  },
})
