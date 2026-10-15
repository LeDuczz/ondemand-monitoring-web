import { defineMessages } from '../../../../../shared/i18n'

export const missionInfoPanelMessages = defineMessages({
  vi: {
    title: 'Thông tin Mission',
    mission: 'Mission',
    order: 'Đơn hàng',
    progress: 'Tiến độ',
    distance: 'Quãng đường',
    points: 'Điểm',
    maxAlt: 'Độ cao tối đa',
    heading: 'Hướng bay',
    auto: 'Tự động',
    manual: 'Thủ công',
    waypointCount: (current: number, total: number) => `WP ${current}/${total}`,
  },
  en: {
    title: 'Mission Info',
    mission: 'Mission',
    order: 'Order',
    progress: 'Progress',
    distance: 'Distance',
    points: 'Points',
    maxAlt: 'Max Alt',
    heading: 'Heading',
    auto: 'Auto',
    manual: 'Manual',
    waypointCount: (current: number, total: number) => `WP ${current}/${total}`,
  },
})
