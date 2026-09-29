import { defineMessages } from '../../../../../shared/i18n'

export const consultationHookMessages = defineMessages({
  vi: {
    loginRequired: 'Bạn cần đăng nhập lại trước khi dùng AI tư vấn.',
    timeout:
      'AI phản hồi quá lâu. Hệ thống đã dừng chờ để tránh treo màn hình, vui lòng gửi lại hoặc thử câu ngắn hơn.',
    noBackendResponse: 'Không nhận được phản hồi từ backend.',
    startFailed: (detail: string) => `Không tạo được phiên tư vấn. ${detail}`,
    replyFailed: (detail: string) => `Không lấy được phản hồi AI. ${detail}`,
  },
  en: {
    loginRequired: 'Please sign in again before using AI consultation.',
    timeout:
      'The AI took too long to respond. The system stopped waiting to avoid freezing the screen. Please resend or try a shorter message.',
    noBackendResponse: 'No response received from the backend.',
    startFailed: (detail: string) =>
      `Could not start the consultation session. ${detail}`,
    replyFailed: (detail: string) => `Could not get an AI reply. ${detail}`,
  },
})
