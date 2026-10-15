import { defineMessages } from '../../../../../shared/i18n'

export const preflightChecklistPanelMessages = defineMessages({
  vi: {
    stepTitle: 'Preflight checklist',
    noDroneAssigned: 'Chưa gán thiết bị',
    statusChecking: 'Đang kiểm tra',
    triggerFailed:
      'Không gọi được API trigger precheck. Hãy mở Drone Stack rồi bấm Trigger lại.',
    precheckConnectionLost:
      'Mất kết nối precheck API. Bấm Trigger precheck để chạy lại.',
    switchingToReady: 'Đang đổi READY_TO_FLY...',
    backendSwitchedReady: 'Backend đã đổi mission sang READY_TO_FLY.',
    backendPreflightUnconfirmed: 'Không xác nhận được backend preflight.',
    weatherForecastUnavailable:
      'Chưa lấy được gợi ý thời tiết theo tọa độ. Operator có thể nhập từ nguồn quan trắc khác.',
  },
  en: {
    stepTitle: 'Preflight checklist',
    noDroneAssigned: 'No device assigned',
    statusChecking: 'Checking',
    triggerFailed:
      'Could not call the trigger precheck API. Open Drone Stack and trigger again.',
    precheckConnectionLost:
      'Lost connection to the precheck API. Press "Trigger precheck" to run it again.',
    switchingToReady: 'Switching to READY_TO_FLY...',
    backendSwitchedReady: 'The backend switched the mission to READY_TO_FLY.',
    backendPreflightUnconfirmed: 'Could not confirm the backend preflight.',
    weatherForecastUnavailable:
      'Could not fetch a coordinate-based weather suggestion. The operator can enter another observed source.',
  },
})
