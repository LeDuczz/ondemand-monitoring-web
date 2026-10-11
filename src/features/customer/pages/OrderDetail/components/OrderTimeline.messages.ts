import { defineMessages } from '../../../../../shared/i18n'

export const orderTimelineMessages = defineMessages({
  vi: {
    title: 'Tiến trình đơn hàng',
    stepSubmitted: 'Gửi yêu cầu',
    stepReview: 'Duyệt đơn',
    stepMonitoring: 'Thực hiện giám sát',
    stepCompleted: 'Hoàn thành',
    hintReview: 'Đang chờ duyệt',
    hintWaiting: 'Chờ bắt đầu thực hiện',
    hintRunning: 'Đang diễn ra',
    by: (name: string) => `bởi ${name}`,
  },
  en: {
    title: 'Order progress',
    stepSubmitted: 'Request submitted',
    stepReview: 'Review',
    stepMonitoring: 'Monitoring',
    stepCompleted: 'Completed',
    hintReview: 'Awaiting review',
    hintWaiting: 'Waiting to start',
    hintRunning: 'Under way',
    by: (name: string) => `by ${name}`,
  },
})
