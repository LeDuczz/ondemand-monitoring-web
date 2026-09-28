import { defineMessages } from '../../../shared/i18n'

export const customerMediaGalleryMessages = defineMessages({
  vi: {
    title: 'Media lần bay',
    description: (n: number) =>
      `Ảnh/video đã xác thực sẽ hiển thị ở đây sau khi operator duyệt tải lên. ${n} thông báo sẵn sàng.`,
    filterLabel: 'Lọc theo lần bay',
    refresh: 'Làm mới',
    loading: 'Đang tải…',
    open: 'Mở hoặc tải xuống',
    cannotLoad: 'Không tải được media lần bay',
    cannotOpen: 'Không mở được media',
  },
  en: {
    title: 'Mission media',
    description: (n: number) =>
      `Validated photos and videos are visible here after the operator approves the upload. ${n} ready notifications.`,
    filterLabel: 'Filter mission',
    refresh: 'Refresh',
    loading: 'Loading…',
    open: 'Open or download',
    cannotLoad: 'Cannot load mission media',
    cannotOpen: 'Cannot open media',
  },
})
