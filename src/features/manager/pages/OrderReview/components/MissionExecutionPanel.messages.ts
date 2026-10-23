import { defineMessages } from '../../../../../shared/i18n'

export const missionExecutionPanelMessages = defineMessages({
  vi: {
    execution: (code: string) => `Thực thi ${code}`,
    checklistLoadFailed:
      'Không thể tải checklist của Mission này. Vui lòng thử lại.',
    resultLoadFailed: 'Không thể tải kết quả của Mission này.',
    retry: 'Thử lại',
    mediaLibrary: 'Thư viện media',
  },
  en: {
    execution: (code: string) => `Execution ${code}`,
    checklistLoadFailed:
      'Could not load the checklist for this Mission. Please try again.',
    resultLoadFailed: 'Could not load the result for this Mission.',
    retry: 'Retry',
    mediaLibrary: 'Media library',
  },
})
