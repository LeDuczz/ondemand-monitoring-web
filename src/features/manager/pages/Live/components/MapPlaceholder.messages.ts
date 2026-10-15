import { defineMessages } from '../../../../../shared/i18n'

export const mapPlaceholderMessages = defineMessages({
  vi: {
    title: 'Vị trí',
    mapAriaLabel: (missionCode: string) => `Bản đồ vị trí ${missionCode}`,
  },
  en: {
    title: 'Position',
    mapAriaLabel: (missionCode: string) => `Location map ${missionCode}`,
  },
})
