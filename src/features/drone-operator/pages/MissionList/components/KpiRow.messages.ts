import { defineMessages } from '../../../../../shared/i18n'

export const kpiRowMessages = defineMessages({
  vi: {
    pending: 'Chờ phản hồi',
    pendingSub: (deadline: string) => `trước ${deadline}`,
    today: 'Hôm nay',
    todayFlyingSub: (count: number) => `${count} đang bay`,
    upcomingWeek: 'Sắp tới trong tuần',
    certValid: 'Chứng chỉ còn hiệu lực',
    certDays: (days: number) => `${days} ngày`,
    certNoData: 'Chưa có dữ liệu',
    certExpirySub: (expiry: string) => `hết hạn ${expiry}`,
  },
  en: {
    pending: 'Awaiting reply',
    pendingSub: (deadline: string) => `by ${deadline}`,
    today: 'Today',
    todayFlyingSub: (count: number) => `${count} in flight`,
    upcomingWeek: 'Upcoming this week',
    certValid: 'Certificate valid for',
    certDays: (days: number) => `${days} days`,
    certNoData: 'No data yet',
    certExpirySub: (expiry: string) => `expires ${expiry}`,
  },
})
