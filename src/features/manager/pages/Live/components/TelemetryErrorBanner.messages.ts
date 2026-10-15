import { defineMessages } from '../../../../../shared/i18n'

export const telemetryErrorBannerMessages = defineMessages({
  vi: {
    telemetryLost: 'Mất kết nối telemetry',
    retry: 'Thử lại',
    getMissions: 'GET /missions/',
    live: '/live · ',
  },
  en: {
    telemetryLost: 'Telemetry connection lost',
    retry: 'Retry',
    getMissions: 'GET /missions/',
    live: '/live · ',
  },
})
