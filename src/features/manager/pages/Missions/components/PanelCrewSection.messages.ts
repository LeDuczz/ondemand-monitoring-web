import { defineMessages } from '../../../../../shared/i18n'

export const panelCrewSectionMessages = defineMessages({
  vi: {
    assignments: {
      title: 'Phân công nguồn lực',
      device: 'Thiết bị',
      reserved: 'Đã giữ lịch',
      empty: 'Mission này chưa có thiết bị hoặc nhân sự được gán.',
    },
    assignedStaff: 'Nhân sự đã phân công',
    staffAccepted: (accepted: number, total: number) =>
      `${accepted}/${total} đã nhận`,
  },
  en: {
    assignments: {
      title: 'Resource assignments',
      device: 'Device',
      reserved: 'Reserved',
      empty: 'No device or staff has been assigned to this mission yet.',
    },
    assignedStaff: 'Assigned staff',
    staffAccepted: (accepted: number, total: number) =>
      `${accepted}/${total} accepted`,
  },
})
