import { defineMessages } from '../../../../../shared/i18n'

export const commitmentsCardMessages = defineMessages({
  vi: {
    commitments: [
      'Tôi đã kiểm tra khu vực bay, không có người và phương tiện trong vùng an toàn, và tuân thủ mọi vùng cấm bay được cảnh báo trong mission.',
      'Tôi giữ thiết bị trong tầm nhìn khi có thể, không bay quá độ cao 120 m và không vượt bán kính vùng giám sát 500 m.',
      'Tôi sẵn sàng bấm RTL hoặc LAND ngay khi có cảnh báo pin thấp, mất telemetry hoặc thời tiết xấu.',
      'Tôi chịu trách nhiệm an toàn vận hành từ lúc xác nhận cho tới khi thiết bị hạ cánh và tắt động cơ.',
    ],
    commitmentTitle: 'Xác nhận bàn giao sau preflight',
  },
  en: {
    commitments: [
      'I have checked the flight area: no people or vehicles in the safety zone, and I comply with every no-fly zone flagged in the mission.',
      'I will keep the device in visual line of sight where possible, stay under 120 m altitude, and stay within the 500 m monitoring radius.',
      'I am ready to trigger RTL or LAND immediately on a low-battery warning, telemetry loss, or bad weather.',
      'I take responsibility for operational safety from confirmation until the device lands and the motors are off.',
    ],
    commitmentTitle: 'Post-preflight handover confirmation',
  },
})
