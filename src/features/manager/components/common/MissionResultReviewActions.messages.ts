import { defineMessages } from '../../../../shared/i18n'

export const missionResultReviewActionsMessages = defineMessages({
  vi: {
    draftResultNotSubmittedFor: 'Kết quả nháp — chưa được gửi để duyệt.',
    ketQuaDaBiTu:
      'Kết quả đã bị từ chối. Nhân sự thực hiện cần chỉnh sửa và gửi lại.',
    theResultHasBeenApproved: 'Kết quả đã được duyệt.',
    rejectionReason: 'Lý do từ chối',
    optional: 'Không bắt buộc',
    enterAReasonIfThe: 'Nhập lý do nếu cần từ chối kết quả…',
    theChecklistIsNotReady: 'Checklist chưa sẵn sàng để duyệt kết quả.',
    rejectResult: 'Từ chối kết quả',
    approveResult: 'Duyệt kết quả',
  },
  en: {
    draftResultNotSubmittedFor: 'Draft result — not submitted for review yet.',
    ketQuaDaBiTu:
      'The result was rejected. The assigned crew must revise and resubmit it.',
    theResultHasBeenApproved: 'The result has been approved.',
    rejectionReason: 'Rejection reason',
    optional: 'Optional',
    enterAReasonIfThe: 'Enter a reason if the result needs to be rejected…',
    theChecklistIsNotReady: 'The checklist is not ready for result approval.',
    rejectResult: 'Reject result',
    approveResult: 'Approve result',
  },
})
