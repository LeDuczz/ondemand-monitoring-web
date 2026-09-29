import { defineMessages } from '../../../../../shared/i18n'

export const findingActionsMessages = defineMessages({
  vi: {
    suggestion: (label: string) => `Gợi ý: ${label}`,
    apply: 'Áp dụng',
    ignore: 'Bỏ qua',
    applied: 'Đã áp dụng gợi ý',
    ignored: 'Đã bỏ qua gợi ý',
    autoFixed: 'Hệ thống đã tự điều chỉnh',
  },
  en: {
    suggestion: (label: string) => `Suggestion: ${label}`,
    apply: 'Apply',
    ignore: 'Ignore',
    applied: 'Suggestion applied',
    ignored: 'Suggestion ignored',
    autoFixed: 'Adjusted automatically',
  },
})
