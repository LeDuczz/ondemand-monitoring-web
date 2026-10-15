import { defineMessages } from '../../../../../shared/i18n'

export const statusFilterChipsMessages = defineMessages({
  vi: {
    title: 'Nhiệm vụ',
    searchPlaceholder: 'Tìm mã nhiệm vụ hoặc đơn hàng',
    searchAria: 'Tìm nhiệm vụ',
    statusChips: {
      ALL: 'Tất cả',
      IN_FLIGHT: 'Đang chạy',
      COMPLETED: 'Hoàn thành',
      FAILED: 'Thất bại',
      CREATED: 'Mới tạo',
    },
  },
  en: {
    title: 'Missions',
    searchPlaceholder: 'Search mission or order code',
    searchAria: 'Search missions',
    statusChips: {
      ALL: 'All',
      IN_FLIGHT: 'Running',
      COMPLETED: 'Completed',
      FAILED: 'Failed',
      CREATED: 'Created',
    },
  },
})
