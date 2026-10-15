import { defineMessages } from '../../../../../shared/i18n'

export const statusChangeModalMessages = defineMessages({
  vi: {
    modal: {
      title: (serial: string, model: string) =>
        `Đổi trạng thái — ${serial} ${model}`,
      cannotChange: (status: string) =>
        `Không thể thay đổi trạng thái thủ công từ ${status}.`,
      newStatus: 'Trạng thái mới',
      reason: 'Lý do',
      reasonPlaceholder: 'Nhập lý do thay đổi trạng thái...',
      reasonRequired: 'Vui lòng nhập lý do',
      cancel: 'Huỷ',
      saving: 'Đang lưu...',
      confirm: 'Xác nhận',
    },
    unknownError: 'Lỗi không xác định',
  },
  en: {
    modal: {
      title: (serial: string, model: string) =>
        `Change status — ${serial} ${model}`,
      cannotChange: (status: string) =>
        `Manual status change is not allowed from ${status}.`,
      newStatus: 'New status',
      reason: 'Reason',
      reasonPlaceholder: 'Enter the reason for the status change...',
      reasonRequired: 'Please enter a reason',
      cancel: 'Cancel',
      saving: 'Saving...',
      confirm: 'Confirm',
    },
    unknownError: 'Unknown error',
  },
})
