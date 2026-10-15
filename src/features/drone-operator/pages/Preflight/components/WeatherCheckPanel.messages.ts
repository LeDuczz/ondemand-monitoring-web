import { defineMessages } from '../../../../../shared/i18n'

export const weatherCheckPanelMessages = defineMessages({
  vi: {
    weatherTitle: 'Thời tiết bay',
    weatherNotChecked: 'CHƯA GHI NHẬN',
    weatherSummary: (
      wind: string,
      gust: string,
      rain: string,
      visibility: string,
    ) =>
      `Gió ${wind} m/s · Giật ${gust} m/s · Mưa ${rain} mm/h · Tầm nhìn ${visibility} km`,
    weatherHint:
      'Hệ thống có thể lấy thời tiết hiện tại theo tọa độ mission; operator đối chiếu ngoài đời rồi xác nhận biên bản.',
    weatherSuggest: 'Lấy thời tiết hiện tại',
    weatherSuggesting: 'Đang lấy thời tiết...',
    weatherCoordinateHint: (lat: string, lon: string) =>
      `Tọa độ mission: ${lat}, ${lon}. Dữ liệu hiện tại chỉ hỗ trợ quyết định, không thay thế xác nhận của operator.`,
    weatherNoCoordinates:
      'Mission chưa có latitude/longitude nên không thể lấy gợi ý tự động.',
  },
  en: {
    weatherTitle: 'Flight weather',
    weatherNotChecked: 'NOT RECORDED',
    weatherSummary: (
      wind: string,
      gust: string,
      rain: string,
      visibility: string,
    ) =>
      `Wind ${wind} m/s · Gust ${gust} m/s · Rain ${rain} mm/h · Visibility ${visibility} km`,
    weatherHint:
      'The system can fetch current weather from mission coordinates; the operator cross-checks and confirms the log.',
    weatherSuggest: 'Fetch current weather',
    weatherSuggesting: 'Fetching weather...',
    weatherCoordinateHint: (lat: string, lon: string) =>
      `Mission coordinates: ${lat}, ${lon}. This current weather supports the decision and does not replace operator confirmation.`,
    weatherNoCoordinates:
      'This mission has no latitude/longitude, so automatic suggestion is unavailable.',
  },
})
