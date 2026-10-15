import { defineMessages } from '../../../../../shared/i18n'

export const missionExecutionPanelMessages = defineMessages({
  vi: {
    thucThi: (a0: string | number | null | undefined) => `Thực thi ${a0}`,
    khongTheTaiChecklistCua:
      'Không thể tải checklist của Mission này. Vui lòng thử lại.',
    couldNotLoadThisMission: 'Không thể tải kết quả của Mission này.',
    retry: 'Thử lại',
    mediaLibrary: 'Thư viện media',
  },
  en: {
    thucThi: (a0: string | number | null | undefined) => `Execution ${a0}`,
    khongTheTaiChecklistCua:
      "Could not load this Mission's checklist. Please try again.",
    couldNotLoadThisMission: "Could not load this Mission's result.",
    retry: 'Retry',
    mediaLibrary: 'Media library',
  },
})
