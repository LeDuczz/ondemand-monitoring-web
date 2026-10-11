import { defineMessages } from '../../../../../shared/i18n'

export const consultationChatMessages = defineMessages({
  vi: {
    summaryTitle: 'AI tư vấn tuỳ chọn',
    summaryHint: 'Chỉ mở khi bạn muốn AI gợi ý thêm. Nếu đã chọn được dịch vụ thì bỏ qua phần này.',
    cardTitle: 'AI tư vấn tuỳ chọn',
    clearAll: 'Xoá toàn bộ',
    consultAgain: 'Tư vấn lại',
    askAi: 'Nhờ AI tư vấn',
    emptyHint:
      'Mô tả ngắn nhu cầu giám sát, AI sẽ gợi ý dịch vụ phù hợp. Bạn có thể bỏ qua phần này.',
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
    summaryTitle: 'Optional AI consultation',
    summaryHint: 'Open only when you want an AI suggestion. Skip this section if you already picked a service.',
    cardTitle: 'Optional AI consultation',
    clearAll: 'Clear all',
    consultAgain: 'Consult again',
    askAi: 'Ask AI consultant',
    emptyHint:
      'Briefly describe your monitoring need and AI will suggest a matching service. You can skip this section.',
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
