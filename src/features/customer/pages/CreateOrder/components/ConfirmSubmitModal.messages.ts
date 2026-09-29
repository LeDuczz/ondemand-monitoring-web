import { defineMessages } from '../../../../../shared/i18n'

export const confirmSubmitModalMessages = defineMessages({
  vi: {
    title: 'Gửi yêu cầu giám sát?',
    subtitle: 'Yêu cầu sẽ được chuyển cho bộ phận vận hành để xem xét và duyệt.',
    service: 'Dịch vụ',
    location: 'Địa điểm',
    dates: 'Ngày bay mong muốn',
    total: 'Chi phí dự kiến',
    totalUnknown: 'Sẽ được xác nhận khi duyệt',
    note: 'Sau khi gửi, bạn có thể theo dõi trạng thái ở mục Đơn của tôi.',
    back: 'Xem lại',
    confirm: 'Xác nhận gửi',
    submitting: 'Đang gửi yêu cầu...',
  },
  en: {
    title: 'Submit this monitoring request?',
    subtitle: 'The request goes to operations for review and approval.',
    service: 'Service',
    location: 'Location',
    dates: 'Preferred flight dates',
    total: 'Estimated cost',
    totalUnknown: 'Confirmed on approval',
    note: 'After submitting you can track its status under My orders.',
    back: 'Review again',
    confirm: 'Confirm and submit',
    submitting: 'Submitting request...',
  },
})
