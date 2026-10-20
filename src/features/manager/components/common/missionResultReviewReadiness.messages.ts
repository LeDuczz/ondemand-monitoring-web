import { defineMessages } from '../../../../shared/i18n'
import type { EvidenceBlockingReason } from '../../../mission/types/checklistExecution'

export const missionResultReviewReadinessMessages = defineMessages({
  vi: {
    reasons: {
      MEDIA_APPROVAL_REQUIRED:
        'Cần duyệt toàn bộ media trước khi duyệt kết quả.',
      MEDIA_REJECTED: 'Media bị từ chối. Cần bổ sung bằng chứng phù hợp.',
      MEDIA_NOT_VALIDATED:
        'Media đang được kiểm tra. Vui lòng chờ trước khi duyệt kết quả.',
      INSUFFICIENT_EVIDENCE:
        'Checklist chưa đủ bằng chứng. Cần bổ sung trước khi duyệt kết quả.',
      EXECUTION_NOT_TERMINAL:
        'Checklist chưa hoàn tất. Cần hoàn tất các mục trước khi duyệt kết quả.',
      EXECUTION_NOT_COMPLETED:
        'Checklist chưa hoàn tất. Cần hoàn tất các mục trước khi duyệt kết quả.',
      UNABLE_REASON_REQUIRED:
        'Cần bổ sung lý do cho mục checklist chưa thể xác minh.',
      CHECKLIST_INTEGRITY_INVALID:
        'Không thể xác nhận checklist. Vui lòng tải lại.',
      EVIDENCE_SOURCE_NOT_ELIGIBLE:
        'Bằng chứng chưa phù hợp. Cần bổ sung ảnh/video phù hợp.',
      EVIDENCE_TYPE_NOT_ELIGIBLE:
        'Loại media chưa phù hợp. Cần bổ sung ảnh/video đúng loại yêu cầu.',
    } as Record<EvidenceBlockingReason, string>,
    checking: 'Đang kiểm tra điều kiện duyệt…',
    unknown: 'Chưa xác nhận được điều kiện duyệt. Vui lòng tải lại checklist.',
    missionNotComplete:
      'Mission chưa hoàn thành. Chỉ duyệt kết quả sau khi Mission hoàn thành.',
    checklistNotReady:
      'Checklist chưa sẵn sàng. Kiểm tra các mục và bằng chứng trước khi duyệt kết quả.',
    sessionExpired: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
    forbidden: 'Bạn không có quyền duyệt kết quả này.',
    notFound: 'Kết quả không còn chờ duyệt. Vui lòng tải lại.',
    checklistNotReadyCode:
      'Checklist hoặc media chưa sẵn sàng. Vui lòng kiểm tra lại trước khi duyệt kết quả.',
    missionStatusInvalid:
      'Trạng thái Mission đã thay đổi. Vui lòng tải lại kết quả.',
    concurrentUpdate:
      'Kết quả đã được cập nhật. Vui lòng tải lại trước khi tiếp tục.',
    fallbackError: 'Không thể duyệt hoặc từ chối kết quả. Vui lòng thử lại.',
  },
  en: {
    reasons: {
      MEDIA_APPROVAL_REQUIRED: 'Approve all media before approving the result.',
      MEDIA_REJECTED: 'Media was rejected. Add suitable evidence.',
      MEDIA_NOT_VALIDATED:
        'Media is being checked. Please wait before approving the result.',
      INSUFFICIENT_EVIDENCE:
        'The checklist has insufficient evidence. Add more before approving the result.',
      EXECUTION_NOT_TERMINAL:
        'The checklist is not finished. Complete the items before approving the result.',
      EXECUTION_NOT_COMPLETED:
        'The checklist is not finished. Complete the items before approving the result.',
      UNABLE_REASON_REQUIRED:
        'Add a reason for the checklist item that could not be verified.',
      CHECKLIST_INTEGRITY_INVALID:
        'The checklist cannot be confirmed. Please reload.',
      EVIDENCE_SOURCE_NOT_ELIGIBLE:
        'The evidence is not suitable. Add suitable photos or videos.',
      EVIDENCE_TYPE_NOT_ELIGIBLE:
        'Media type does not match the requirement. Add photos/videos of the required type.',
    },
    checking: 'Checking approval conditions…',
    unknown:
      'Approval conditions could not be confirmed. Please reload the checklist.',
    missionNotComplete:
      'The Mission is not complete. Approve the result only after the Mission is complete.',
    checklistNotReady:
      'The checklist is not ready. Check the items and evidence before approving the result.',
    sessionExpired: 'Your session has expired. Please sign in again.',
    forbidden: 'You do not have permission to approve this result.',
    notFound: 'The result is no longer awaiting approval. Please reload.',
    checklistNotReadyCode:
      'The checklist or media is not ready. Please check again before approving the result.',
    missionStatusInvalid:
      'The Mission status has changed. Please reload the result.',
    concurrentUpdate:
      'The result was updated. Please reload before continuing.',
    fallbackError: 'Could not approve or reject the result. Please try again.',
  },
})
