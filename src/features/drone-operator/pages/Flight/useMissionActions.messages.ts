import { defineMessages } from '../../../../shared/i18n'

export const missionActionsMessages = defineMessages({
  vi: {
    controllerOffline: 'Bộ điều khiển ngoại tuyến hoặc lệnh bị từ chối',
    settingWeather: (preset: string) => `Đang đặt thời tiết ${preset}`,
    weatherPending: (label: string, status: string) =>
      `Thời tiết ${label}: ${status} (đang chờ hiển thị)`,
    weatherUpdated: (label: string, status: string) =>
      `Thời tiết ${label}: ${status}`,
    weatherOffline: 'Bộ điều khiển thời tiết ngoại tuyến',
    startingFlight: 'Đang bắt đầu chuyến bay...',
    flightStarted: 'Mission đã chuyển sang Đang bay',
    finishingFlight: 'Đang cập nhật hoàn thành bay...',
    flightFinished: 'Đã cập nhật bay xong - chờ maintainer postcheck',
    mustLand:
      'Cần hạ cánh và kiểm tra đúng phiên Mission trước khi kết thúc vận hành.',
  },
  en: {
    controllerOffline: 'Controller offline or command rejected',
    settingWeather: (preset: string) => `Setting weather ${preset}`,
    weatherPending: (label: string, status: string) =>
      `Weather ${label}: ${status} (visual pending)`,
    weatherUpdated: (label: string, status: string) =>
      `Weather ${label}: ${status}`,
    weatherOffline: 'Weather controller offline',
    startingFlight: 'Starting flight...',
    flightStarted: 'Mission is in flight',
    finishingFlight: 'Updating flight completion...',
    flightFinished: 'Flight finished - waiting for maintainer postcheck',
    mustLand:
      'The drone must land and the exact mission session must be verified before ending operations.',
  },
})
