import { defineMessages } from '../../../../../shared/i18n'

export const findingListMessages = defineMessages({
  vi: {
    title: 'Các điểm cần lưu ý',
    emptyTitle: 'Không có điểm cần lưu ý',
    emptyDescription: 'AI đánh giá yêu cầu hoàn toàn khả thi.',
    actionFailed: 'Không thể cập nhật gợi ý. Vui lòng thử lại.',
  },
  en: {
    title: 'Findings',
    emptyTitle: 'No issues found',
    emptyDescription: 'AI assessed this request as fully feasible.',
    actionFailed: 'Could not update the suggestion. Please try again.',
  },
})
