import { defineMessages } from '../../../../../shared/i18n'

export const lidarRadarOverlayMessages = defineMessages({
  vi: {
    status: {
      danger: 'NGUY HIỂM',
      caution: 'CẢNH BÁO',
      active: 'HOẠT ĐỘNG',
      unknown: 'KHÔNG RÕ',
      stale: 'DỮ LIỆU CŨ',
      clear: 'AN TOÀN',
    },
    direction: {
      front: 'TRƯỚC',
      left: 'TRÁI',
      right: 'PHẢI',
      back: 'SAU',
    },
  },
  en: {
    status: {
      danger: 'DANGER',
      caution: 'CAUTION',
      active: 'ACTIVE',
      unknown: 'UNKNOWN',
      stale: 'STALE',
      clear: 'CLEAR',
    },
    direction: {
      front: 'FRONT',
      left: 'LEFT',
      right: 'RIGHT',
      back: 'BACK',
    },
  },
})
