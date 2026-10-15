import { defineMessages } from '../../../../../shared/i18n'

export const droneCardMessages = defineMessages({
  vi: {
    candidate: {
      battery: 'Pin',
      distanceToStation: 'Cách trạm',
      enduranceMargin: 'Thời gian bay dư',
      payload: 'Payload',
      hoursSinceMaintenance: 'Giờ bay từ lần bảo trì',
      whySuggested: 'Vì sao gợi ý',
      aiNote: '(AI diễn giải, điểm số do hệ thống tính)',
      locking: 'Đang khóa…',
      selectThisDrone: 'Chọn drone này',
    },
    km: ' km',
  },
  en: {
    candidate: {
      battery: 'Battery',
      distanceToStation: 'Distance to station',
      enduranceMargin: 'Flight-time margin',
      payload: 'Payload',
      hoursSinceMaintenance: 'Hours since maintenance',
      whySuggested: 'Why suggested',
      aiNote: '(AI-generated explanation, score computed by the system)',
      locking: 'Locking…',
      selectThisDrone: 'Select this drone',
    },
    km: ' km',
  },
})
