import { defineMessages } from '../../../../../shared/i18n'

export const summaryBannerMessages = defineMessages({
  vi: {
    itemsPassed: 'mục đạt',
    passReady: 'PASS · đủ điều kiện cất cánh',
    failBlocked: (items: string) => `FAIL · CHẶN BAY · Không đạt: ${items}`,
    runningPrecheck: (progress: number) => `Đang chạy precheck... ${progress}%`,
    pressTriggerHint: 'Bấm Trigger precheck để gọi API kiểm tra thiết bị.',
    switchingToReady: 'Đang đổi READY_TO_FLY...',
    continueToHandover: 'Tiếp tục tới bàn giao',
    triggeringAgain: 'Đang kiểm...',
    triggerAgain: 'Kiểm tra lại',
    triggerPrecheck: 'Bắt đầu kiểm tra',
  },
  en: {
    itemsPassed: 'items passed',
    passReady: 'PASS · cleared for takeoff',
    failBlocked: (items: string) => `FAIL · FLIGHT BLOCKED · Failed: ${items}`,
    runningPrecheck: (progress: number) => `Running precheck... ${progress}%`,
    pressTriggerHint: 'Press "Trigger precheck" to call the device check API.',
    switchingToReady: 'Switching to READY_TO_FLY...',
    continueToHandover: 'Continue to handover',
    triggeringAgain: 'Triggering...',
    triggerAgain: 'Trigger precheck again',
    triggerPrecheck: 'Trigger precheck',
  },
})
