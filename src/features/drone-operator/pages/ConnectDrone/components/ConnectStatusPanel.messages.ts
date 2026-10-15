import { defineMessages } from '../../../../../shared/i18n'

export const connectStatusPanelMessages = defineMessages({
  vi: {
    codeExpiredTitle: 'Mã kết nối đã hết hạn',
    codeExpiredBody:
      'Mã flight_token chỉ có hiệu lực 10 phút. Yêu cầu quản lý cấp mã mới rồi nhập lại.',
    continueToPrecheck: 'Tiếp tục: precheck',
    backToMission: 'Quay lại mission',
  },
  en: {
    codeExpiredTitle: 'Connection code expired',
    codeExpiredBody:
      'The flight_token code is valid for 10 minutes only. Ask a manager to issue a new one and enter it again.',
    continueToPrecheck: 'Continue: precheck',
    backToMission: 'Back to mission',
  },
})
