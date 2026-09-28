import { defineMessages } from '../../../shared/i18n'

export const rejectDialogMessages = defineMessages({
  vi: {
    title: (missionId: string) => `Từ chối mission ${missionId}`,
    reasons: [
      'Trùng lịch cá nhân',
      'Chưa đủ điều kiện vận hành',
      'Địa điểm quá xa',
      'Dự báo thời tiết xấu',
      'Lý do khác',
    ],
    notesLabel: 'Ghi chú (tuỳ chọn)',
    notesPlaceholder: 'Mô tả thêm lý do từ chối...',
    cancel: 'Huỷ',
    submitting: 'Đang gửi...',
    submit: 'Xác nhận từ chối',
  },
  en: {
    title: (missionId: string) => `Reject mission ${missionId}`,
    reasons: [
      'Personal schedule conflict',
      'Not yet qualified to operate',
      'Location too far',
      'Poor weather forecast',
      'Other reason',
    ],
    notesLabel: 'Notes (optional)',
    notesPlaceholder: 'Add more detail about the rejection...',
    cancel: 'Cancel',
    submitting: 'Submitting...',
    submit: 'Confirm rejection',
  },
})
