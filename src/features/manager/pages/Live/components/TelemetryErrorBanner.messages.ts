import { defineMessages } from '../../../../../shared/i18n'

export const telemetryErrorBannerMessages = defineMessages({
  vi: {
    telemetryLost: 'Chưa nhận được dữ liệu telemetry',
    hint: 'Hệ thống sẽ tự thử lại sau vài giây.',
    retry: 'Thử lại',
    getMissions: 'GET /missions/',
    live: '/live · ',
  },
  en: {
    telemetryLost: 'Telemetry is not available yet',
    hint: 'The system will retry automatically in a few seconds.',
    retry: 'Retry',
    getMissions: 'GET /missions/',
    live: '/live · ',
  },
})
