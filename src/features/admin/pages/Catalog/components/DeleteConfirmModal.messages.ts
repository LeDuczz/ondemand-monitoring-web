import { defineMessages } from '../../../../../shared/i18n'

export const deleteConfirmMessages = defineMessages({
  vi: {
    confirmPrefix: 'Bạn có chắc muốn xoá',
    confirmSuffix: '? Thao tác này không thể hoàn tác.',
    cancel: 'Huỷ',
    processing: 'Đang xoá...',
    action: 'Xoá',
    genericError: 'Không xoá được. Vui lòng thử lại.',
  },
  en: {
    confirmPrefix: 'Are you sure you want to delete',
    confirmSuffix: '? This action cannot be undone.',
    cancel: 'Cancel',
    processing: 'Deleting...',
    action: 'Delete',
    genericError: 'Could not delete. Please try again.',
  },
})
