import { defineMessages } from '../../../../../shared/i18n'

export const zoneStatusNoticeMessages = defineMessages({
  vi: {
    outsideTitle: 'Ngoài vùng phục vụ',
    outsideMessage:
      'Điểm này chưa thuộc vùng giám sát nào. Hãy bấm vào phần bản đồ nằm trong khu vực xanh để tạo yêu cầu.',
    blockedTitle: 'Chạm vùng cấm bay',
    blockedMessage: (zoneNames: string) =>
      `Bán kính giám sát đang lấn vào vùng cấm ${zoneNames}. Vui lòng chọn điểm khác hoặc giảm bán kính.`,
    validTitle: 'Hợp lệ',
    validMessage: (zoneSuffix: string) =>
      `Nằm trong vùng giám sát${zoneSuffix} và không chạm vùng cấm bay.`,
  },
  en: {
    outsideTitle: 'Outside service area',
    outsideMessage:
      'This point is not inside any monitoring zone yet. Click the green area on the map to create the request.',
    blockedTitle: 'Touching a no-fly zone',
    blockedMessage: (zoneNames: string) =>
      `The monitoring radius overlaps the no-fly zone ${zoneNames}. Please pick another point or reduce the radius.`,
    validTitle: 'Valid',
    validMessage: (zoneSuffix: string) =>
      `Inside the monitoring zone${zoneSuffix} and not touching any no-fly zone.`,
  },
})
