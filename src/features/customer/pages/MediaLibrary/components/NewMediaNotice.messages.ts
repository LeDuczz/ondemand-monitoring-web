import { defineMessages } from '../../../../../shared/i18n'

export const newMediaNoticeMessages = defineMessages({
  vi: {
    text: (n: number) => `${n} thông báo kết quả mới sẵn sàng.`,
    view: 'Xem thông báo',
  },
  en: {
    text: (n: number) => `${n} new result notification(s) ready.`,
    view: 'View notifications',
  },
})
