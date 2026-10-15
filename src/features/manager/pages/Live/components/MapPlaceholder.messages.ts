import { defineMessages } from '../../../../../shared/i18n'

export const mapPlaceholderMessages = defineMessages({
  vi: {
    mapAriaLabel: (missionCode: string) => `Bản đồ vị trí ${missionCode}`,
  },
  en: {
    mapAriaLabel: (missionCode: string) => `Location map ${missionCode}`,
  },
})
