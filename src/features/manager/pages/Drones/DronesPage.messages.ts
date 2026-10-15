import { defineMessages } from '../../../../shared/i18n'

export const dronesPageMessages = defineMessages({
  vi: {
    title: 'Đội drone',
    droneCount: (n: number) => `${n} drone`,
  },
  en: {
    title: 'Drone fleet',
    droneCount: (n: number) => `${n} drones`,
  },
})
