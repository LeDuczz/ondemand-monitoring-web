import { defineMessages } from '../../../../../shared/i18n'

export const weatherRowMessages = defineMessages({
  vi: {
    weatherSuitability: {
      GOOD: 'Thuận lợi',
      CAUTION: 'Cân nhắc',
      POOR: 'Không thuận lợi',
    } as Record<string, string>,
    weatherChecking: 'Đang kiểm tra',
    weatherNotReady: 'Chưa có dữ liệu',
    weatherUnknown: 'Chưa rõ thời tiết',
    weatherLoading: 'Đang kiểm tra thời tiết...',
    weatherUnavailable: 'Chưa có dự báo cho ngày này.',
    weatherError: 'Không tải được dự báo.',
  },
  en: {
    weatherSuitability: {
      GOOD: 'Good',
      CAUTION: 'Caution',
      POOR: 'Poor',
    } as Record<string, string>,
    weatherChecking: 'Checking',
    weatherNotReady: 'No data',
    weatherUnknown: 'Unknown weather',
    weatherLoading: 'Checking weather...',
    weatherUnavailable: 'No forecast for this date yet.',
    weatherError: 'Could not load forecast.',
  },
})
