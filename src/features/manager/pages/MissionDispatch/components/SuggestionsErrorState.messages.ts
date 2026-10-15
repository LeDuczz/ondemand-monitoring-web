import { defineMessages } from '../../../../../shared/i18n'

export const suggestionsErrorStateMessages = defineMessages({
  vi: {
    suggestionsErrorTitle: 'Không lấy được gợi ý nguồn lực',
    suggestionsErrorBody:
      'Dịch vụ diễn giải AI phản hồi chậm. Bạn vẫn có thể xem hạng do hệ thống tính (không có phần "Vì sao gợi ý").',
    retry: 'Thử lại',
  },
  en: {
    suggestionsErrorTitle: 'Could not get resource suggestions',
    suggestionsErrorBody:
      'The AI explanation service is responding slowly. You can still see the system-computed ranking (without the "Why suggested" section).',
    retry: 'Retry',
  },
})
