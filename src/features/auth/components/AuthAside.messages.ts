import { defineMessages } from '../../../shared/i18n'

// Copy sourced from evd/design/SYS-01.dc.html / SYS-02.dc.html aside card
// (brand subtitle + 3 value-prop bullets). `vi` is unchanged from the
// original Vietnamese copy; `en` is a natural translation for Phase 2.
export const authAsideMessages = defineMessages({
  vi: {
    asideLabel: 'OnDemand Monitor - dịch vụ giám sát bằng drone theo yêu cầu',
    brandSubtitle: 'Dịch vụ giám sát bằng drone theo yêu cầu',
    valueProps: [
      {
        icon: 'map-pin',
        text: 'Chọn vị trí và bán kính giám sát ngay trên bản đồ',
      },
      {
        icon: 'zap',
        text: 'AI kiểm tra tính khả thi, gợi ý ngày thay thế trước khi gửi duyệt',
      },
      {
        icon: 'radio',
        text: 'Xem trực tiếp khi drone bay và nhận ảnh, video đã xác thực',
      },
    ] as { icon: 'map-pin' | 'zap' | 'radio'; text: string }[],
  },
  en: {
    asideLabel: 'OnDemand Monitor - on-demand drone monitoring service',
    brandSubtitle: 'On-demand drone monitoring service',
    valueProps: [
      {
        icon: 'map-pin',
        text: 'Pick a location and monitoring radius right on the map',
      },
      {
        icon: 'zap',
        text: 'AI checks feasibility and suggests an alternative date before you submit',
      },
      {
        icon: 'radio',
        text: 'Watch live while the drone flies and get verified photos and video',
      },
    ] as { icon: 'map-pin' | 'zap' | 'radio'; text: string }[],
  },
})
