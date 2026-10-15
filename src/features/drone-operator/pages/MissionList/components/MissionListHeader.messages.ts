import { defineMessages } from '../../../../../shared/i18n'

export const missionListHeaderMessages = defineMessages({
  vi: {
    weekdays: [
      'Chủ Nhật',
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy',
    ],
    title: 'Mission của tôi',
    pilotRank: (rank: string) => ` · phi công hạng ${rank}`,
    declareAvailability: 'Khai báo lịch rảnh',
    manageMaintenance: 'Quản lý Bảo trì & Sự cố',
  },
  en: {
    weekdays: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ],
    title: 'My missions',
    pilotRank: (rank: string) => ` · pilot rank ${rank}`,
    declareAvailability: 'Set availability',
    manageMaintenance: 'Manage maintenance & incidents',
  },
})
