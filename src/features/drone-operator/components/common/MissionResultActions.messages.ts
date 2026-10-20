import { defineMessages } from '../../../../shared/i18n'

export const missionResultActionsMessages = defineMessages({
  vi: {
    confirmingChecklist: 'Đang xác nhận checklist và quyền thao tác.',
    remainingItems: (n: number) => `Còn ${n} mục checklist chưa hoàn tất.`,
    needUnableReason: 'Cần bổ sung lý do cho mục không thể xác minh.',
    integrityInvalid:
      'Checklist chưa được xác nhận. Vui lòng làm mới và kiểm tra lại.',
    mediaRejected:
      'Có media bằng chứng bị từ chối. Cần bổ sung bằng chứng hợp lệ.',
    mediaNotValidated: 'Media bằng chứng chưa xác thực thành công.',
    checklistNotReady:
      'Checklist chưa sẵn sàng hoặc chưa đủ bằng chứng hợp lệ. Kiểm tra các mục và media đã gắn.',
    sessionExpired: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
    forbidden: 'Bạn không có quyền thực hiện thao tác này.',
    statusInvalid:
      'Trạng thái Mission đã thay đổi. Dữ liệu mới đang được cập nhật.',
    executionLocked:
      'Kết quả đã được gửi hoặc duyệt. Dữ liệu mới đang được cập nhật.',
    checklistNotComplete:
      'Checklist chưa hoàn tất hoặc chưa đủ bằng chứng hợp lệ.',
    genericError:
      'Không thể thực hiện thao tác. Dữ liệu mới đang được cập nhật; vui lòng kiểm tra và thử lại.',
    wrongMediaType:
      'Một hoặc nhiều mục có media sai loại. Thay bằng đúng loại ảnh/video theo yêu cầu của từng mục.',
    insufficientEvidence:
      'Chưa đủ bằng chứng hợp lệ theo số lượng yêu cầu. Kiểm tra tiến độ từng mục và bổ sung phần còn thiếu.',
    completeFirst: 'Cần xác nhận hoàn thành Mission trước khi gửi kết quả.',
    sectionAriaLabel: 'Nghiệm thu và gửi kết quả',
    completed: 'Mission đã được nghiệm thu.',
    pendingReview: 'Mission đang chờ nghiệm thu.',
    approvedNote: 'Kết quả đã được Manager duyệt.',
    submittedNote: 'Kết quả đã được gửi Manager và đang chờ duyệt.',
    approvedBadge: 'Đã duyệt',
    pendingBadge: 'Chờ duyệt',
    completeMission: 'Xác nhận hoàn thành Mission',
    submitResult: 'Gửi kết quả cho Manager',
    processing: 'Đang xử lý…',
  },
  en: {
    confirmingChecklist: 'Confirming the checklist and action permissions.',
    remainingItems: (n: number) => `${n} checklist item(s) not completed yet.`,
    needUnableReason: 'A reason is required for items that cannot be verified.',
    integrityInvalid:
      'The checklist has not been confirmed. Please refresh and check again.',
    mediaRejected:
      'Some evidence media was rejected. Valid evidence must be added.',
    mediaNotValidated: 'Evidence media has not been validated successfully.',
    checklistNotReady:
      'The checklist is not ready or lacks valid evidence. Check the items and attached media.',
    sessionExpired: 'Your session has expired. Please sign in again.',
    forbidden: 'You do not have permission to perform this action.',
    statusInvalid:
      'The Mission status has changed. Fresh data is being loaded.',
    executionLocked:
      'The result has already been submitted or approved. Fresh data is being loaded.',
    checklistNotComplete:
      'The checklist is incomplete or lacks valid evidence.',
    genericError:
      'Could not perform the action. Fresh data is being loaded; please check and try again.',
    wrongMediaType:
      'One or more items have the wrong media type. Replace it with the right photo/video type for each item.',
    insufficientEvidence:
      'Not enough valid evidence for the required quantity. Check each item progress and add what is missing.',
    completeFirst:
      'Confirm the Mission is completed before submitting the result.',
    sectionAriaLabel: 'Accept and submit result',
    completed: 'The Mission has been accepted.',
    pendingReview: 'The Mission is awaiting acceptance.',
    approvedNote: 'The result has been approved by the Manager.',
    submittedNote:
      'The result has been sent to the Manager and is awaiting approval.',
    approvedBadge: 'Approved',
    pendingBadge: 'Pending approval',
    completeMission: 'Confirm Mission completed',
    submitResult: 'Submit result to Manager',
    processing: 'Processing…',
  },
})
