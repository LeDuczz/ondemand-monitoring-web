import { defineMessages } from '../../../../shared/i18n'

export const missionListPageMessages = defineMessages({
  vi: {
    loadFailedTitle: 'Không tải được danh sách mission',
    loadFailedDesc:
      'Mất kết nối hoặc máy chủ đang bận. Dữ liệu đã lưu vẫn an toàn.',
    retry: 'Thử lại',
  },
  en: {
    loadFailedTitle: 'Could not load the mission list',
    loadFailedDesc:
      'Connection lost or the server is busy. Saved data is still safe.',
    retry: 'Retry',
  },
})
