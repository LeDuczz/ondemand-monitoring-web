import { defineMessages } from '../../../../../shared/i18n'

export const analysisLogTableMessages = defineMessages({
  vi: {
    session: 'Phiên',
    orderId: 'Mã đơn',
    verdict: 'Kết luận',
    blockerWarning: 'Chặn / Cảnh báo',
    ruleEngineMs: 'Thời gian luật (ms)',
    llmTokens: 'Token LLM',
    triggeredBy: 'Kích hoạt bởi',
    timestamp: 'Thời điểm',
    verdicts: {
      FEASIBLE: 'Khả thi',
      RISKY: 'Rủi ro',
      INFEASIBLE: 'Không khả thi',
    },
  },
  en: {
    session: 'Session',
    orderId: 'Order ID',
    verdict: 'Verdict',
    blockerWarning: 'Blocker / Warning',
    ruleEngineMs: 'Rule engine (ms)',
    llmTokens: 'LLM tokens',
    triggeredBy: 'Triggered by',
    timestamp: 'Timestamp',
    verdicts: {
      FEASIBLE: 'Feasible',
      RISKY: 'Risky',
      INFEASIBLE: 'Infeasible',
    },
  },
})
