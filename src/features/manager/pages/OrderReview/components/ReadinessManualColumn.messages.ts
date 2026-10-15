import { defineMessages } from '../../../../../shared/i18n'

export const readinessManualColumnMessages = defineMessages({
  vi: {
    managerConfirms: 'Manager xác nhận',
    confirmed: ' đã xác nhận',
    required: 'Bắt buộc',
    confirmedBy: 'Người xác nhận: ',
    failureReasonRequired: 'Lý do không đạt (bắt buộc)',
    note: 'Ghi chú',
    ghiChu2: (a0: string | number | null | undefined) => `Ghi chú: ${a0}`,
    save: 'Lưu',
    saving: 'Đang lưu…',
  },
  en: {
    managerConfirms: 'Manager confirms',
    confirmed: ' confirmed',
    required: 'Required',
    confirmedBy: 'Confirmed by: ',
    failureReasonRequired: 'Failure reason (required)',
    note: 'Note',
    ghiChu2: (a0: string | number | null | undefined) => `Note: ${a0}`,
    save: 'Save',
    saving: 'Saving…',
  },
})
