import { defineMessages } from '../../../shared/i18n'

// Copy sourced from evd/design/SYS-01.dc.html / SYS-02.dc.html aside card
// (brand subtitle + 3 value-prop bullets). `vi` is unchanged from the
// original Vietnamese copy; `en` is a natural translation for Phase 2.
export const authAsideMessages = defineMessages({
  vi: {
    asideLabel: 'OnDemand Monitor - dịch vụ giám sát bằng drone theo yêu cầu',
    brandSubtitle: 'Dịch vụ giám sát bằng drone theo yêu cầu',
    heroTitle: 'Giám sát thông minh',
    heroAccent: 'vươn xa tầm nhìn',
    heroDescription: 'Khai thác sức mạnh công nghệ drone và AI để giám sát, phân tích và bảo vệ những gì quan trọng với bạn.',
    valueProps: [
      {
        icon: 'map-pin',
        text: 'Chọn vị trí và bán kính giám sát ngay trên bản đồ',
        detail: 'Dễ dàng thiết lập khu vực cần giám sát với bản đồ trực quan.',
      },
      {
        icon: 'zap',
        text: 'AI kiểm tra tính khả thi, gợi ý ngày thay thế trước khi gửi duyệt',
        detail: 'Công nghệ AI giúp tối ưu thời gian và điều kiện bay.',
      },
      {
        icon: 'radio',
        text: 'Xem trực tiếp khi drone bay và nhận ảnh, video đã xác thực',
        detail: 'Theo dõi thời gian thực với dữ liệu an toàn và minh bạch.',
      },
    ] as {
      icon: 'map-pin' | 'zap' | 'radio'
      text: string
      detail: string
    }[],
  },
  en: {
    asideLabel: 'OnDemand Monitor - on-demand drone monitoring service',
    brandSubtitle: 'On-demand drone monitoring service',
    heroTitle: 'Smarter monitoring',
    heroAccent: 'a wider perspective',
    heroDescription: 'Harness drone technology and AI to monitor, analyze, and protect what matters most.',
    valueProps: [
      {
        icon: 'map-pin',
        text: 'Pick a location and monitoring radius right on the map',
        detail: 'Set the monitoring area easily on an intuitive map.',
      },
      {
        icon: 'zap',
        text: 'AI checks feasibility and suggests an alternative date before you submit',
        detail: 'AI helps optimize flight timing and conditions.',
      },
      {
        icon: 'radio',
        text: 'Watch live while the drone flies and get verified photos and video',
        detail: 'Follow every flight with secure, transparent live data.',
      },
    ] as {
      icon: 'map-pin' | 'zap' | 'radio'
      text: string
      detail: string
    }[],
  },
})
