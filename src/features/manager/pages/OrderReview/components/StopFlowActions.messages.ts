import { defineMessages } from '../../../../../shared/i18n'

export const stopFlowActionsMessages = defineMessages({
  vi: {
    cancelMission: (code: string) => `Hủy Mission ${code}`,
    replaceMission: (code: string) => `Thay thế Mission ${code}`,
  },
  en: {
    cancelMission: (code: string) => `Cancel Mission ${code}`,
    replaceMission: (code: string) => `Replace Mission ${code}`,
  },
})
