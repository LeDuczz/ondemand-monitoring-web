import { defineMessages } from '../../../../../shared/i18n'

export const analysisHeaderMessages = defineMessages({
  vi: {
    backToOrder: '← Quay lại đơn hàng',
    title: 'Phân tích AI',
    subtitle: 'Đánh giá khả năng thực hiện yêu cầu giám sát của bạn.',
    analyzedAt: (time: string) => `Phân tích lúc ${time}`,
    verdict: {
      FEASIBLE: 'Khả thi',
      RISKY: 'Có rủi ro',
      INFEASIBLE: 'Không khả thi',
    },
  },
  en: {
    backToOrder: '← Back to order',
    title: 'AI analysis',
    subtitle: 'How feasible your monitoring request is.',
    analyzedAt: (time: string) => `Analysed at ${time}`,
    verdict: {
      FEASIBLE: 'Feasible',
      RISKY: 'Some risk',
      INFEASIBLE: 'Not feasible',
    },
  },
})
