import { defineMessages } from '../../shared/i18n'

// Technical workspace content is independent of the account role.
export const technicalOverviewMessages = defineMessages({
  vi: {
    content: {
      title: 'Vận hành hệ thống',
      subtitle:
        'Theo dõi tình trạng thiết bị, khả năng truyền telemetry và các sự cố vận hành.',
      eyebrow: 'Độ tin cậy nền tảng',
      primary: 'Xem tình trạng thiết bị',
      metrics: [
        {
          label: 'Thiết bị trực tuyến',
          value: '28/30',
          detail: '2 thiết bị cần chú ý',
          icon: 'radio',
        },
        {
          label: 'Tình trạng telemetry',
          value: '99.2%',
          detail: '24 giờ gần nhất',
          icon: 'chart',
        },
        {
          label: 'Cảnh báo đang hoạt động',
          value: '03',
          detail: '1 cảnh báo ưu tiên cao',
          icon: 'shield',
        },
        {
          label: 'Thời gian hoạt động dịch vụ',
          value: '99.98%',
          detail: 'Tháng hiện tại',
          icon: 'clock',
        },
      ],
      activities: [
        'DRONE-07 đã bỏ lỡ 3 nhịp telemetry',
        'Độ trễ dịch vụ media đã trở lại bình thường',
        'Cần xoay vòng chứng chỉ thiết bị trong 9 ngày nữa',
      ],
    },
  },
  en: {
    content: {
      title: 'System operations',
      subtitle:
        'Monitor device health, telemetry availability, and operational incidents.',
      eyebrow: 'Platform reliability',
      primary: 'Review device health',
      metrics: [
        {
          label: 'Devices online',
          value: '28/30',
          detail: '2 require attention',
          icon: 'radio',
        },
        {
          label: 'Telemetry health',
          value: '99.2%',
          detail: 'Last 24 hours',
          icon: 'chart',
        },
        {
          label: 'Active alerts',
          value: '03',
          detail: '1 high priority',
          icon: 'shield',
        },
        {
          label: 'Service uptime',
          value: '99.98%',
          detail: 'Current month',
          icon: 'clock',
        },
      ],
      activities: [
        'DRONE-07 has missed 3 telemetry heartbeats',
        'Media service latency returned to normal',
        'Device certificate rotation due in 9 days',
      ],
    },
  },
})
