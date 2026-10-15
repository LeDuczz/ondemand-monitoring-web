import { defineMessages } from '../../../../../shared/i18n'

export const overviewTabMessages = defineMessages({
  vi: {
    map: {
      title: 'Bản đồ nhiệm vụ',
      route: 'Đường bay',
      waypoint: 'Waypoint',
      target: 'Điểm giám sát',
      distance: 'Quãng đường',
      altitude: 'Độ cao tối đa',
      home: 'Điểm xuất phát (H)',
    },
    kpi: {
      drone: 'Thiết bị',
    },
    khongTheTaiChecklistCua:
      'Không thể tải checklist của Mission này. Vui lòng thử lại.',
    mediaLibrary: 'Thư viện media',
  },
  en: {
    map: {
      title: 'Mission map',
      route: 'Flight route',
      waypoint: 'Waypoint',
      target: 'Monitoring point',
      distance: 'Distance',
      altitude: 'Max altitude',
      home: 'Start point (H)',
    },
    kpi: {
      drone: 'Device',
    },
    khongTheTaiChecklistCua:
      "Could not load this Mission's checklist. Please try again.",
    mediaLibrary: 'Media library',
  },
})
