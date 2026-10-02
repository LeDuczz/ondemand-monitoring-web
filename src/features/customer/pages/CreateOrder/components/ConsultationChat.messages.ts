import { defineMessages } from '../../../../../shared/i18n'

export const consultationChatMessages = defineMessages({
  vi: {
    cardTitle: 'AI tư vấn nhu cầu',
    clearAll: 'Xoá toàn bộ',
    consultAgain: 'Tư vấn lại',
    askAi: 'Nhờ AI tư vấn',
    emptyHint:
      'AI sẽ hỏi nhu cầu giám sát, mục tiêu, rủi ro cần phát hiện và đề xuất dịch vụ phù hợp. Vị trí đã lấy từ bước 1; AI không tự quyết lịch bay.',
    you: 'Bạn',
    assistant: 'AI tư vấn',
    typing: 'AI đang phân tích nhu cầu...',
    placeholder:
      'VD: Tôi có một khu đất trồng cà phê, cây phát triển không đồng đều...',
    inputLabel: 'Tin nhắn cho AI tư vấn',
    send: 'Gửi',
    recentTitle: 'Gửi lại nhanh',
    recentAria: (text: string) => `Gửi lại: ${text}`,
  },
  en: {
    cardTitle: 'AI needs consultation',
    clearAll: 'Clear all',
    consultAgain: 'Consult again',
    askAi: 'Ask AI consultant',
    emptyHint:
      'The AI will ask about your monitoring needs, targets and risks to detect, then suggest a suitable service. Location is taken from step 1; the AI does not decide the flight schedule.',
    you: 'You',
    assistant: 'AI consultant',
    typing: 'AI is analysing your needs...',
    placeholder:
      'E.g. I have a coffee plantation and the plants are growing unevenly...',
    inputLabel: 'Message to the AI consultant',
    send: 'Send',
    recentTitle: 'Quick resend',
    recentAria: (text: string) => `Send again: ${text}`,
  },
})
