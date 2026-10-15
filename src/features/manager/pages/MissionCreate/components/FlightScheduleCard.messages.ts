import { defineMessages } from '../../../../../shared/i18n'

export const flightScheduleCardMessages = defineMessages({
  vi: {
    flightSchedule: 'Lịch bay thực tế do nhân sự chọn',
    durationLabel: (text: string) => `Thời lượng dự kiến: ${text}`,
    flightScheduleHint:
      'Chọn giờ bay cụ thể cho nhiệm vụ. Hệ thống không tự lấy thời gian từ đơn hàng.',
    fillFromCustomer: 'Điền theo khung giờ khách chọn',
    start: 'Giờ cất cánh',
    end: 'Giờ kết thúc dự kiến',
    scheduleSummary: (from: string, to: string) =>
      `Lịch đã chọn: ${from} → ${to}`,
  },
  en: {
    flightSchedule: 'Actual flight schedule selected by staff',
    durationLabel: (text: string) => `Estimated duration: ${text}`,
    flightScheduleHint:
      'Choose the concrete mission flight time. The system does not copy the order time automatically.',
    fillFromCustomer: "Fill from the customer's time slot",
    start: 'Takeoff time',
    end: 'Estimated finish time',
    scheduleSummary: (from: string, to: string) =>
      `Selected schedule: ${from} → ${to}`,
  },
})
