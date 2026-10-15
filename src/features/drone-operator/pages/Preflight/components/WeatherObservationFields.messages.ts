import { defineMessages } from '../../../../../shared/i18n'

export const weatherObservationFieldsMessages = defineMessages({
  vi: {
    weatherSource: 'Nguồn kiểm tra',
    weatherSourcePlaceholder: 'VD: Windy, AccuWeather, trạm khí tượng...',
    weatherObservedAt: 'Thời điểm xem',
    weatherWind: 'Gió',
    weatherGust: 'Gió giật',
    weatherRain: 'Mưa',
    weatherVisibility: 'Tầm nhìn',
    weatherTemperature: 'Nhiệt độ',
    weatherHumidity: 'Độ ẩm',
    weatherDecision: 'Kết luận của operator',
    weatherDecisionPass: 'An toàn để bay',
    weatherDecisionWarn: 'Cảnh báo, vẫn cho phép bay',
    weatherDecisionFail: 'Không an toàn, chặn bay',
    weatherNotes: 'Ghi chú căn cứ',
    weatherNotesPlaceholder:
      'VD: trời quang, gió ổn định; đã đối chiếu khu vực bay...',
  },
  en: {
    weatherSource: 'Source checked',
    weatherSourcePlaceholder: 'Ex: Windy, AccuWeather, weather station...',
    weatherObservedAt: 'Observed at',
    weatherWind: 'Wind',
    weatherGust: 'Gust',
    weatherRain: 'Rain',
    weatherVisibility: 'Visibility',
    weatherTemperature: 'Temperature',
    weatherHumidity: 'Humidity',
    weatherDecision: 'Operator decision',
    weatherDecisionPass: 'Safe to fly',
    weatherDecisionWarn: 'Caution, allow flight',
    weatherDecisionFail: 'Unsafe, block flight',
    weatherNotes: 'Evidence notes',
    weatherNotesPlaceholder:
      'Ex: clear sky, stable wind; cross-checked near the flight area...',
  },
})
