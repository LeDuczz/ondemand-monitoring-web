import { defineMessages } from '../../../../../shared/i18n'

export const liveActionsMessages = defineMessages({
  vi: {
    title: 'Thao tác khẩn',
    help: 'Ghi nhận sự cố để lưu lại diễn biến. Huỷ khẩn sẽ gửi lệnh RTL tới drone và không thể hoàn tác.',
    recordIncident: 'Ghi nhận sự cố',
    urgentCancel: 'Huỷ mission khẩn',
  },
  en: {
    title: 'Emergency actions',
    help: 'Report an incident to keep a record. Emergency cancel sends an RTL command to the drone and cannot be undone.',
    recordIncident: 'Report incident',
    urgentCancel: 'Emergency cancel',
  },
})
