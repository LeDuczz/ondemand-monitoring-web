import { defineMessages } from '../../../../../shared/i18n'

export const missionKpisMessages = defineMessages({
  vi: {
    kpi: {
      customer: 'Khách hàng',
      schedule: 'Lịch bay',
      drone: 'Thiết bị',
      crew: 'Đội bay',
      media: 'Media',
      actualDuration: 'Thời lượng thực tế',
      plannedDuration: 'Thời lượng dự kiến',
    },
    crewAccepted: (accepted: number, total: number) =>
      `${accepted}/${total} đã nhận`,
  },
  en: {
    kpi: {
      customer: 'Customer',
      schedule: 'Schedule',
      drone: 'Device',
      crew: 'Crew',
      media: 'Media',
      actualDuration: 'Actual duration',
      plannedDuration: 'Planned duration',
    },
    crewAccepted: (accepted: number, total: number) =>
      `${accepted}/${total} accepted`,
  },
})
