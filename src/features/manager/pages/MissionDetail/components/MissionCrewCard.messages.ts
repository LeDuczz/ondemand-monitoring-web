import { defineMessages } from '../../../../../shared/i18n'

export const missionCrewCardMessages = defineMessages({
  vi: {
    crewCard: 'Phân công nguồn lực',
    crewAccepted: (accepted: number, total: number) =>
      `${accepted}/${total} đã nhận`,
    crewDevice: 'Thiết bị',
    crewReserved: 'Đã giữ lịch',
    crewEmpty: 'Nhiệm vụ này chưa có thiết bị hoặc nhân sự được gán.',
  },
  en: {
    crewCard: 'Resource assignment',
    crewAccepted: (accepted: number, total: number) =>
      `${accepted}/${total} accepted`,
    crewDevice: 'Device',
    crewReserved: 'Reserved',
    crewEmpty: 'No device or staff assigned to this mission yet.',
  },
})
