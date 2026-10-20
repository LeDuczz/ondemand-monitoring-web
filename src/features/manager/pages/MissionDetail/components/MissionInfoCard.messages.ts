import { defineMessages } from '../../../../../shared/i18n'

export const missionInfoCardMessages = defineMessages({
  vi: {
    infoCard: 'Thông tin nhiệm vụ',
    notRecorded: 'Chưa ghi nhận',
    fields: {
      order: 'Đơn hàng',
      service: 'Dịch vụ',
      scheduledStart: 'Bắt đầu dự kiến',
      scheduledEnd: 'Kết thúc dự kiến',
      started: 'Bắt đầu thực tế',
      completed: 'Kết thúc thực tế',
      address: 'Địa chỉ',
      coordinates: 'Tọa độ',
      mediaType: 'Loại media',
      failure: 'Lý do lỗi',
    },
  },
  en: {
    infoCard: 'Mission information',
    notRecorded: 'Not recorded',
    fields: {
      order: 'Order',
      service: 'Service',
      scheduledStart: 'Planned start',
      scheduledEnd: 'Planned end',
      started: 'Actual start',
      completed: 'Actual end',
      address: 'Address',
      coordinates: 'Coordinates',
      mediaType: 'Media type',
      failure: 'Failure reason',
    },
  },
})
