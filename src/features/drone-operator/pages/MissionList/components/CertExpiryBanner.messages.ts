import { defineMessages } from '../../../../../shared/i18n'

export const certExpiryBannerMessages = defineMessages({
  vi: {
    certExpiring: (expiry: string, daysLeft: number) =>
      `Chứng chỉ hết hạn ${expiry}, còn ${daysLeft} ngày.`,
    certExpiringHint: 'Gia hạn để không bị chặn phân công.',
    viewProfile: 'Xem hồ sơ',
  },
  en: {
    certExpiring: (expiry: string, daysLeft: number) =>
      `Certificate expires ${expiry}, ${daysLeft} days left.`,
    certExpiringHint: 'Renew it so assignments are not blocked.',
    viewProfile: 'View profile',
  },
})
