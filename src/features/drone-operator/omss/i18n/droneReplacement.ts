import { defineMessages } from '../../../../shared/i18n'

export const droneReplacementMessages = defineMessages({
  vi: {
    preflightFailure: 'Kiểm tra trước bay thất bại',
    title: 'Chọn drone thay thế',
    description:
      'không khả dụng. Chọn một drone thay thế đang sẵn sàng từ danh sách bên dưới.',
    unavailable: 'Không khả dụng',
    state: 'Trạng thái',
    removed: '✕ Đã loại bỏ',
    notReady: 'Chưa sẵn sàng',
    available: 'Sẵn sàng',
    selected: '✓ Đã chọn',
    battery: 'Pin',
    gps: 'GPS',
    storage: 'Bộ nhớ',
    sats: 'vệ tinh',
    confirmReplacement: 'Xác nhận thay thế — chạy kiểm tra trước bay',
  },
  en: {
    preflightFailure: 'Pre-flight failure',
    title: 'Select replacement drone',
    description:
      'is unavailable. Choose an available replacement from the list below.',
    unavailable: 'Unavailable',
    state: 'State',
    removed: '✕ Removed',
    notReady: 'Not ready',
    available: 'Available',
    selected: '✓ Selected',
    battery: 'Battery',
    gps: 'GPS',
    storage: 'Storage',
    sats: 'sats',
    confirmReplacement: 'Confirm replacement — run pre-flight',
  },
})
