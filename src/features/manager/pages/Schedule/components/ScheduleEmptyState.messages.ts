import { defineMessages } from '../../../../../shared/i18n'

export const scheduleEmptyStateMessages = defineMessages({
  vi: {
    emptyTitle: 'Chưa có nhiệm vụ được lên lịch trong tuần này',
    emptyDescription:
      'Nhiệm vụ xuất hiện sau khi đơn được duyệt và tạo nhiệm vụ.',
    backToQueue: 'Về hàng đợi duyệt',
  },
  en: {
    emptyTitle: 'No missions scheduled this week',
    emptyDescription:
      'Missions appear once an order is approved and a mission is created.',
    backToQueue: 'Back to the review queue',
  },
})
