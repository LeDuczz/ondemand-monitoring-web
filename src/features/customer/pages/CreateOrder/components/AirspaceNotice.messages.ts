import { defineMessages } from '../../../../../shared/i18n'

export const airspaceNoticeMessages = defineMessages({
  vi: {
    title: 'Khu vực cần xin phép bay',
    message: (zoneName: string) =>
      `Vùng giám sát nằm trong khu vực kiểm soát không lưu của ${zoneName}. Chuyến bay chỉ được thực hiện khi có giấy phép hợp lệ.`,
    question: 'Bạn đã có giấy phép bay chưa?',
    havePermit: 'Tôi đã có giấy phép bay',
    needSupport: 'Tôi cần hỗ trợ xin phép',
    permitNumberLabel: 'Số giấy phép',
    permitNumberPlaceholder: 'VD: GP-2026-0123',
    supportHint: 'Đội vận hành sẽ liên hệ để hướng dẫn thủ tục xin phép trước khi duyệt yêu cầu.',
  },
  en: {
    title: 'Flight permit required',
    message: (zoneName: string) =>
      `The monitoring area is inside the controlled airspace of ${zoneName}. Flights are only allowed with a valid permit.`,
    question: 'Do you already hold a flight permit?',
    havePermit: 'I already have a flight permit',
    needSupport: 'I need help getting a permit',
    permitNumberLabel: 'Permit number',
    permitNumberPlaceholder: 'E.g. GP-2026-0123',
    supportHint: 'The operations team will contact you about the permit procedure before approving the request.',
  },
})
