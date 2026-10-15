import { defineMessages } from '../../../../../shared/i18n'

export const weatherForecastCardMessages = defineMessages({
  vi: {
    weatherForecastTitle: 'Dự báo thời tiết theo khoảng khách yêu cầu',
    weatherForecastTime: (time: string) => `Mốc giờ kiểm tra: ${time}`,
    weatherForecastHint:
      'Hiển thị từng ngày trong khoảng khách chọn để nhân sự cân nhắc trước khi xếp lịch bay thực tế.',
    weatherNoLocation: 'Đơn chưa có toạ độ nên chưa xem được dự báo.',
    weatherNoDates: 'Đơn chưa có khoảng ngày hợp lệ để xem dự báo.',
  },
  en: {
    weatherForecastTitle: 'Weather forecast for the requested window',
    weatherForecastTime: (time: string) => `Check time: ${time}`,
    weatherForecastHint:
      'Shows every day in the customer-selected range so staff can choose the actual flight schedule.',
    weatherNoLocation:
      'This order has no coordinates, so forecast is unavailable.',
    weatherNoDates: 'This order has no valid date range for forecast.',
  },
})
