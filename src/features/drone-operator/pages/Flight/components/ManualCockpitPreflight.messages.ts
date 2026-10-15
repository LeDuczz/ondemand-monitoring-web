import { defineMessages } from '../../../../../shared/i18n'

export const manualCockpitPreflightMessages = defineMessages({
  vi: {
    title: 'Kiểm tra thủ công',
    continuing: 'Đang qua bước...',
    skip: 'Qua bước này',
    items: {
      drone: 'Drone đã bật nguồn',
      gps: 'GPS đã sẵn sàng',
      battery: 'Pin đủ bay demo',
      propeller: 'Cánh quạt an toàn',
      area: 'Khu vực cất cánh thông thoáng',
    },
  },
  en: {
    title: 'Manual preflight',
    continuing: 'Continuing...',
    skip: 'Skip to flight',
    items: {
      drone: 'Drone powered on',
      gps: 'GPS ready',
      battery: 'Battery ready for demo',
      propeller: 'Propellers safe',
      area: 'Takeoff area clear',
    },
  },
})
