import { defineMessages } from '../../../../../shared/i18n'

export const planTabMessages = defineMessages({
  vi: {
    planCard: 'Kế hoạch bay',
    waypoints: {
      title: 'Danh sách waypoint',
      columns: {
        seq: '#',
        type: 'Loại điểm',
        x: 'X',
        y: 'Y',
        altitude: 'Độ cao',
        speed: 'Tốc độ',
      },
      empty: 'Chưa có waypoint.',
    },
  },
  en: {
    planCard: 'Flight plan',
    waypoints: {
      title: 'Waypoints',
      columns: {
        seq: '#',
        type: 'Type',
        x: 'X',
        y: 'Y',
        altitude: 'Altitude',
        speed: 'Speed',
      },
      empty: 'No waypoints yet.',
    },
  },
})
