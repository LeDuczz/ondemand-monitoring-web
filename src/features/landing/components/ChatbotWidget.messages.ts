import { defineMessages } from '../../../shared/i18n'

// The regex patterns match Vietnamese user input only (the chatbot's input
// box is not itself translated input-side); they stay outside the bilingual
// message tree since `RegExp` isn't a message value `defineMessages` can
// widen. Each pattern lines up positionally with `responses[i]` below.
export const kbPatterns: RegExp[] = [
  /gi[aá]|ph[ií]|chi ph[ií]|bao nhi[eê]u/i,
  /duy[eệ]t|bao l[aâ]u/i,
  /th[oờ]i ti[eế]t|m[uư]a|gi[oó]/i,
  /c[aấ]m bay|gi[aấ]y ph[eé]p|ph[aá]p/i,
  /tr[uự]c ti[eế]p|live|xem/i,
  /[aả]nh|video|k[eế]t qu[aả]|t[aả]i/i,
  /t[aạ]o|[dđ][aặ]t|y[eê]u c[aầ]u/i,
]

export const chatbotWidgetMessages = defineMessages({
  vi: {
    responses: [
      'Chi phí phụ thuộc loại dịch vụ, diện tích và thời lượng bay. Bạn sẽ thấy báo giá ngay khi hoàn tất bước chọn khu vực, trước khi gửi duyệt.',
      'Đơn thường được duyệt trong khoảng 2 giờ làm việc. Đơn có điểm khả thi cao sẽ được xử lý nhanh hơn.',
      'Nếu thời tiết không phù hợp, hệ thống sẽ cảnh báo và gợi ý khung giờ khác. Mission bị hoãn vì thời tiết không bị tính phí.',
      'Hệ thống tự động đối chiếu vị trí của bạn với vùng cấm bay và kiểm tra giấy phép phi công trước khi cho phép gửi yêu cầu.',
      'Khi mission ở trạng thái IN_FLIGHT, bạn xem được livestream, vị trí, pin và độ cao của drone trong mục Theo dõi trực tiếp.',
      'Ảnh và video được kiểm tra chất lượng rồi mới đưa vào thư viện kết quả. Bạn có thể tải từng tệp hoặc cả mission.',
      'Rất đơn giản: đăng nhập, chọn vị trí và khung giờ trên bản đồ, để AI kiểm tra khả thi rồi gửi duyệt. Bạn muốn mình dẫn đến bước tạo yêu cầu không?',
    ],
    chips: [
      'Cách tạo yêu cầu',
      'Bao lâu được duyệt?',
      'Chi phí thế nào?',
      'Nếu thời tiết xấu?',
    ],
    defaultMessage:
      'Mình chưa chắc về câu này. Bạn thử hỏi về chi phí, thời gian duyệt, thời tiết, vùng cấm bay hoặc cách tạo yêu cầu, hoặc liên hệ support@odms.vn nhé.',
    greeting:
      'Xin chào! Mình là trợ lý AI của OnDemand Monitor. Mình có thể giúp bạn tạo yêu cầu, kiểm tra khả thi và theo dõi mission.',
    assistantName: 'Trợ lý ODMS',
    onlineStatus: '● Trực tuyến · Trả lời trong giây lát',
    close: 'Đóng trợ lý',
    inputPlaceholder: 'Nhập câu hỏi của bạn...',
    send: 'Gửi',
    hint: 'Xin chào! Cần mình giúp gì không? 👋',
    fabAriaLabel: 'Trợ lý AI',
  },
  en: {
    responses: [
      'Cost depends on the service, area and flight duration. You will see a quote right after choosing the area, before submitting.',
      'Orders are usually approved within 2 business hours. Orders with a high feasibility score are typically processed faster.',
      'If the weather is unsuitable, the system will warn you and suggest another time slot. A mission postponed due to weather is never charged.',
      'The system automatically checks your location against no-fly zones and verifies the pilot license before allowing the request to be submitted.',
      'While a mission is IN_FLIGHT, you can watch the livestream, position, battery and altitude of the drone in Live tracking.',
      'Photos and video are checked for quality before they reach the results library. You can download individual files or an entire mission.',
      'It is simple: log in, pick a location and time slot on the map, let the AI check feasibility, then submit. Want me to take you to the create-request step?',
    ],
    chips: [
      'How to create a request',
      'How long does approval take?',
      'How much does it cost?',
      'What if the weather is bad?',
    ],
    defaultMessage:
      "I'm not sure about that one. Try asking about cost, approval time, weather, no-fly zones or how to create a request, or contact support@odms.vn.",
    greeting:
      "Hi! I'm the OnDemand Monitor AI assistant. I can help you create a request, check feasibility and track missions.",
    assistantName: 'ODMS Assistant',
    onlineStatus: '● Online · Replies in a moment',
    close: 'Close assistant',
    inputPlaceholder: 'Type your question...',
    send: 'Send',
    hint: 'Hi! Need any help? 👋',
    fabAriaLabel: 'AI Assistant',
  },
})
