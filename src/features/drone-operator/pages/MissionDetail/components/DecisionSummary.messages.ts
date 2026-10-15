import { defineMessages } from '../../../../../shared/i18n'

export const decisionSummaryMessages = defineMessages({
  vi: {
    ariaLabel: 'Thông tin để quyết định',
    title: 'Thông tin để quyết định',
    area: '📍 Khu vực',
    time: '🕐 Thời gian',
    scope: '🛩 Phạm vi',
    radius: (meters: number) => `Bán kính ${meters} m`,
    missionType: '📋 Loại nhiệm vụ',
    respondBy: '⏳ Hạn phản hồi',
    managerNote: '⚠ Lưu ý từ manager',
  },
  en: {
    ariaLabel: 'Information to decide',
    title: 'Information to decide',
    area: '📍 Area',
    time: '🕐 Time',
    scope: '🛩 Scope',
    radius: (meters: number) => `Radius ${meters} m`,
    missionType: '📋 Mission type',
    respondBy: '⏳ Respond by',
    managerNote: '⚠ Manager note',
  },
})
