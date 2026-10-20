import { defineMessages } from '../../../../shared/i18n'

export const missionResultReviewActionsMessages = defineMessages({
  vi: {
    draftResultNotSubmittedFor: 'Kết quả nháp — chưa được gửi để duyệt.',
    ketQuaDaBiTu:
      'Kết quả đã bị từ chối. Nhân sự thực hiện cần chỉnh sửa và gửi lại.',
    theResultHasBeenApproved: 'Kết quả đã được duyệt.',
    rejectionReason: 'Ghi chú / lý do',
    optional: 'Cần khi từ chối, hoặc khi duyệt dù thiếu ảnh/video so với đơn',
    enterAReasonIfThe:
      'Nhập lý do (ít nhất 10 ký tự) nếu từ chối hoặc duyệt khi còn thiếu media…',
    theChecklistIsNotReady: 'Checklist chưa sẵn sàng để duyệt kết quả.',
    rejectResult: 'Từ chối kết quả',
    approveResult: 'Duyệt kết quả',
  },
  en: {
    draftResultNotSubmittedFor: 'Draft result — not submitted for review yet.',
    ketQuaDaBiTu:
      'The result was rejected. The assigned crew must revise and resubmit it.',
    theResultHasBeenApproved: 'The result has been approved.',
    rejectionReason: 'Note / reason',
    optional:
      'Required when rejecting, or when approving with fewer photos/videos than ordered',
    enterAReasonIfThe:
      'Enter a reason (at least 10 characters) if rejecting or approving with media still missing…',
    theChecklistIsNotReady: 'The checklist is not ready for result approval.',
    rejectResult: 'Reject result',
    approveResult: 'Approve result',
  },
})
