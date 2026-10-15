import { defineMessages } from '../../../../../shared/i18n'

export const lockedDroneCardMessages = defineMessages({
  vi: {
    candidate: {
      battery: 'Pin',
      distanceToStation: 'Cách trạm',
      enduranceMargin: 'Thời gian bay dư',
      payload: 'Payload',
      hoursSinceMaintenance: 'Giờ bay từ lần bảo trì',
      changeDrone: 'Đổi drone → Đội drone',
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
      changeDrone: 'Change drone → Drone fleet',
    },
    km: ' km',
  },
})
