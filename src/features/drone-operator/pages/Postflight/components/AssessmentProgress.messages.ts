import { defineMessages } from '../../../../../shared/i18n'

export const assessmentProgressMessages = defineMessages({
  vi: {
    assessmentProgress: 'Tiến độ đánh giá',
    itemsAssessed: (count: number, total: number) =>
      `${count} / ${total} mục đã kiểm tra`,
    someFailed: (count: number) => `${count} KHÔNG ĐẠT`,
    allPassed: '100% ĐẠT',
    passAll: '✓ Đánh giá tất cả ĐẠT',
  },
  en: {
    assessmentProgress: 'Assessment progress',
    itemsAssessed: (count: number, total: number) =>
      `${count} / ${total} items checked`,
    someFailed: (count: number) => `${count} FAILED`,
    allPassed: '100% PASSED',
    passAll: '✓ Mark all as PASS',
  },
})
