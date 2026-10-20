import { defineMessages } from '../../../shared/i18n'

export const monitoringChecklistMessages = defineMessages({
  vi: {
    statuses: {
      PENDING: 'Chưa thực hiện',
      IN_PROGRESS: 'Đang thực hiện',
      COMPLETED: 'Đã thực hiện',
      UNABLE_TO_VERIFY: 'Không thể xác minh',
    },
    assessments: {
      NOT_ASSESSED: 'Chưa đánh giá',
      COMPLIANT: 'Đạt yêu cầu',
      NON_COMPLIANT: 'Không đạt yêu cầu',
    },
    errPermissions:
      'Chưa xác minh được quyền thao tác. Vui lòng làm mới hoặc đăng nhập lại.',
    errParentMismatch:
      'Mục checklist không thuộc mission này. Vui lòng tải lại đúng mission.',
    errConcurrent:
      'Dữ liệu đã thay đổi. Chỉnh sửa của bạn chưa được lưu. Tải dữ liệu mới và kiểm tra lại trước khi lưu.',
    err401: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
    err403: 'Bạn không có quyền thực hiện thao tác này.',
    err404: 'Không tìm thấy mission hoặc mục checklist. Vui lòng tải lại.',
    errLocked:
      'Checklist đã khóa để duyệt kết quả. Vui lòng tải lại trạng thái.',
    errTransition: 'Chuyển trạng thái không hợp lệ. Vui lòng tải lại dữ liệu.',
    errMissionStatus: 'Trạng thái mission đã thay đổi. Vui lòng tải lại.',
    errNotReady:
      'Checklist chưa sẵn sàng gửi kết quả. Vui lòng kiểm tra các mục còn lại.',
    errNotReadyType:
      'Một hoặc nhiều mục cần loại media khác. Chọn và gắn đúng loại ảnh/video theo yêu cầu từng mục, sau đó thử lại.',
    errNotReadyEvidence:
      'Chưa đủ bằng chứng hợp lệ. Kiểm tra số lượng hiện tại và yêu cầu từng mục, sau đó bổ sung phần còn thiếu.',
    progressTitle: 'Tiến độ hoàn tất checklist',
    doneCount: (done: number, total: number) => `${done} / ${total} mục hoàn tất`,
    attachedEvidenceCount: (n: number) => `${n} bằng chứng đã gắn`,
    shortfall: (n: number) => `còn thiếu ${n}`,
    needRightType: 'cần đúng loại media',
    err409:
      'Dữ liệu đã thay đổi hoặc thao tác chưa đủ điều kiện. Vui lòng tải lại.',
    errGeneric: 'Không thể tải hoặc lưu checklist. Vui lòng thử lại.',
    acceptanceTitle: 'Checklist nghiệm thu',
    loading: 'Đang tải checklist…',
    retry: 'Thử lại checklist',
    resultRejected: 'Kết quả bị từ chối',
    legacySnapshot:
      'Mission cũ — không có snapshot checklist giám sát lịch sử.',
    noItems: 'Không có mục checklist giám sát.',
    readOnlyLocked: 'Chỉ đọc — kết quả đang chờ duyệt hoặc đã được duyệt.',
    readOnlyNoPermission:
      '🔒 Checklist chưa thể cập nhật. Bạn có thể cập nhật tiến độ và bằng chứng khi nhiệm vụ bước vào giai đoạn thực hiện.',
    backendNotReady:
      'Dữ liệu checklist chưa đủ điều kiện theo backend. Hãy làm mới; nếu vẫn chưa sẵn sàng, liên hệ quản trị viên.',
    evidence: 'bằng chứng',
    chipTodo: 'Cần làm',
    chipMissingEvidence: 'Thiếu bằng chứng',
    chipUnable: 'Không xác minh',
    updatedPrefix: 'Cập nhật',
    monitoringTitle: 'Checklist thực hiện',
    monitoringSubtitle: 'Các mục cần thực hiện và bằng chứng cho nhiệm vụ này.',
    refresh: 'Tải lại',
    refreshTitle: 'Lấy dữ liệu checklist mới nhất',
    previewNoticeTitle: '🔒 Checklist chưa thể cập nhật',
    previewNoticeBody:
      'Bạn đang xem trước nội dung. Sau khi chấp nhận nhiệm vụ, bạn có thể cập nhật tiến độ và bằng chứng.',
    previewMinEvidence: (n: number) => `Bằng chứng tối thiểu: ${n}`,
    loadingWithResult: 'Đang tải checklist và trạng thái kết quả…',
    readyToSubmit: 'Sẵn sàng gửi kết quả',
    notReadyToSubmit: 'Chưa sẵn sàng gửi kết quả',
    progressSummary: (done: number, total: number) =>
      `${done} / ${total} mục ở trạng thái kết thúc · ${total - done} mục chưa hoàn tất`,
    resultStatusLabel: 'Trạng thái kết quả:',
    resultStatuses: {
      DRAFT: 'Nháp — chưa gửi manager',
      PENDING_MANAGER_APPROVAL: 'Đã gửi manager',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Bị từ chối — có thể chỉnh sửa và gửi lại khi có quyền',
    },
    managerNote: 'Nhận xét của manager:',
    legacyNoInference:
      'Mission cũ — không có snapshot checklist giám sát lịch sử. Không suy diễn yêu cầu từ dịch vụ hiện tại.',
    canUpdate: 'Bạn có thể cập nhật checklist.',
    reasonRequired: 'Vui lòng nhập lý do không thể xác minh.',
    tooLong: 'Ghi nhận tối đa 2000 ký tự; lý do tối đa 1000 ký tự.',
    fieldStatus: 'Trạng thái',
    fieldAssessment: 'Đánh giá',
    fieldNote: 'Ghi chú',
    noNote: 'Chưa có ghi chú',
    unableReason: 'Lý do không thể xác minh',
    edit: 'Chỉnh sửa',
    assessHelp: 'ⓘ Đánh giá không đạt không tự động làm mission thất bại.',
    notePlaceholder: 'Thêm ghi chú nếu cần...',
    useFresh: 'Dùng dữ liệu mới (bỏ chỉnh sửa chưa lưu)',
    cancel: 'Hủy',
    save: 'Lưu',
    observation: 'Ghi nhận:',
    updatedColon: 'Cập nhật:',
    updateItem: 'Cập nhật mục',
    execStatusField: 'Trạng thái thực hiện',
    assessHelpLong:
      'Không đạt yêu cầu không đồng nghĩa mission thất bại. Chưa đánh giá là lựa chọn hợp lệ.',
    observationField: 'Ghi nhận',
    saveItem: 'Lưu mục',
    cancelEdit: 'Hủy chỉnh sửa',
  },
  en: {
    statuses: {
      PENDING: 'Not started',
      IN_PROGRESS: 'In progress',
      COMPLETED: 'Completed',
      UNABLE_TO_VERIFY: 'Unable to verify',
    },
    assessments: {
      NOT_ASSESSED: 'Not assessed',
      COMPLIANT: 'Compliant',
      NON_COMPLIANT: 'Non-compliant',
    },
    errPermissions:
      'Could not verify your permissions. Please refresh or sign in again.',
    errParentMismatch:
      'This checklist item does not belong to this mission. Please reload the correct mission.',
    errConcurrent:
      'The data has changed. Your edits were not saved. Load the latest data and review before saving.',
    err401: 'Your session has expired. Please sign in again.',
    err403: 'You do not have permission to perform this action.',
    err404: 'Mission or checklist item not found. Please reload.',
    errLocked:
      'The checklist is locked for result approval. Please reload the status.',
    errTransition: 'Invalid status transition. Please reload the data.',
    errMissionStatus: 'The mission status has changed. Please reload.',
    errNotReady:
      'The checklist is not ready to submit the result. Please check the remaining items.',
    errNotReadyType:
      'One or more items need a different media type. Pick and attach the right photo/video type for each item, then try again.',
    errNotReadyEvidence:
      'Not enough valid evidence. Check the current count and each item requirement, then add what is missing.',
    progressTitle: 'Checklist completion progress',
    doneCount: (done: number, total: number) => `${done} / ${total} items done`,
    attachedEvidenceCount: (n: number) => `${n} evidence attached`,
    shortfall: (n: number) => `${n} missing`,
    needRightType: 'needs the right media type',
    err409: 'The data has changed or the action is not allowed. Please reload.',
    errGeneric: 'Could not load or save the checklist. Please try again.',
    acceptanceTitle: 'Acceptance checklist',
    loading: 'Loading checklist…',
    retry: 'Retry checklist',
    resultRejected: 'Result rejected',
    legacySnapshot:
      'Legacy mission — no historical monitoring checklist snapshot.',
    noItems: 'No monitoring checklist items.',
    readOnlyLocked: 'Read-only — the result is pending approval or approved.',
    readOnlyNoPermission:
      '🔒 The checklist cannot be updated yet. You can update progress and evidence once the mission enters the execution phase.',
    backendNotReady:
      'The checklist data does not meet backend requirements yet. Refresh; if it is still not ready, contact an administrator.',
    evidence: 'evidence',
    chipTodo: 'To do',
    chipMissingEvidence: 'Missing evidence',
    chipUnable: 'Not verifiable',
    updatedPrefix: 'Updated',
    monitoringTitle: 'Execution checklist',
    monitoringSubtitle: 'Items to carry out and the evidence for this mission.',
    refresh: 'Reload',
    refreshTitle: 'Fetch the latest checklist data',
    previewNoticeTitle: '🔒 The checklist cannot be updated yet',
    previewNoticeBody:
      'You are previewing the content. After you accept the mission you can update progress and evidence.',
    previewMinEvidence: (n: number) => `Minimum evidence: ${n}`,
    loadingWithResult: 'Loading checklist and result status…',
    readyToSubmit: 'Ready to submit result',
    notReadyToSubmit: 'Not ready to submit result',
    progressSummary: (done: number, total: number) =>
      `${done} / ${total} items finished · ${total - done} not completed`,
    resultStatusLabel: 'Result status:',
    resultStatuses: {
      DRAFT: 'Draft — not sent to manager',
      PENDING_MANAGER_APPROVAL: 'Sent to manager',
      APPROVED: 'Approved',
      REJECTED: 'Rejected — can be edited and resubmitted when permitted',
    },
    managerNote: 'Manager comment:',
    legacyNoInference:
      'Legacy mission — no historical monitoring checklist snapshot. Requirements are not inferred from the current service.',
    canUpdate: 'You can update the checklist.',
    reasonRequired: 'Please enter the reason it cannot be verified.',
    tooLong: 'Observation is limited to 2000 characters; reason to 1000.',
    fieldStatus: 'Status',
    fieldAssessment: 'Assessment',
    fieldNote: 'Note',
    noNote: 'No note yet',
    unableReason: 'Reason it cannot be verified',
    edit: 'Edit',
    assessHelp:
      'ⓘ A non-compliant assessment does not automatically fail the mission.',
    notePlaceholder: 'Add a note if needed...',
    useFresh: 'Use latest data (discard unsaved edits)',
    cancel: 'Cancel',
    save: 'Save',
    observation: 'Observation:',
    updatedColon: 'Updated:',
    updateItem: 'Update item',
    execStatusField: 'Execution status',
    assessHelpLong:
      'Non-compliant does not mean the mission failed. Not assessed is a valid choice.',
    observationField: 'Observation',
    saveItem: 'Save item',
    cancelEdit: 'Cancel editing',
  },
})
