import { defineMessages } from '../../../../../shared/i18n'

export const wizardFooterMessages = defineMessages({
  vi: {
    back: 'Quay lại',
    continueTo: (label: string) => `Tiếp tục: ${label}`,
    submit: 'Gửi yêu cầu',
  },
  en: {
    back: 'Back',
    continueTo: (label: string) => `Continue: ${label}`,
    submit: 'Submit request',
  },
})
