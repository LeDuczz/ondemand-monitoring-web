import { defineMessages } from '../../../shared/i18n'

export const liveHubPageMessages = defineMessages({
  vi: {
    title: 'Xem trực tiếp',
    live: '● LIVE',
    viewersWatching: (n: number) => `👥 ${n} đang xem`,
    enterLive: 'Vào xem trực tiếp →',
    noSessionTitle: 'Không có phiên trực tiếp',
    noSessionDescription: 'Hiện chưa có mission nào đang bay trực tiếp.',
  },
  en: {
    title: 'Live view',
    live: '● LIVE',
    viewersWatching: (n: number) => `👥 ${n} watching`,
    enterLive: 'Watch live →',
    noSessionTitle: 'No live session',
    noSessionDescription: 'No mission is currently flying live.',
  },
})
