import { defineMessages } from '../../../shared/i18n'

export const certExpiryBannerMessages = defineMessages({
  vi: {
    warning: 'Cảnh báo:',
    summary: (count: number) => `${count} phi công có chứng chỉ sắp hết hạn:`,
    daysLeft: (days: number, date: string) =>
      `còn ${days} ngày — hết hạn ${date}`,
  },
  en: {
    warning: 'Warning:',
    summary: (count: number) =>
      `${count} pilot(s) with certificates expiring soon:`,
    daysLeft: (days: number, date: string) =>
      `${days} days left — expires ${date}`,
  },
})
