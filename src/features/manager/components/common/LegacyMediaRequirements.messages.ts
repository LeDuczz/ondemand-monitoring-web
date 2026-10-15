import { defineMessages } from '../../../../shared/i18n'

export const legacyMediaRequirementsMessages = defineMessages({
  vi: {
    unit: {
      items: (n: number) => `${n} mục`,
    },
  },
  en: {
    unit: {
      items: (n: number) => `${n} items`,
    },
  },
})
