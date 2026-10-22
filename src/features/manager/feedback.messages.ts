import { defineMessages } from '../../shared/i18n'

/** Toast and confirm-dialog copy shared across the Manager portal. */
export const managerFeedbackMessages = defineMessages({
  vi: {
    orderApproved: 'Đã duyệt đơn.',
    orderRejected: 'Đã từ chối đơn.',
    infoRequested: 'Đã gửi yêu cầu bổ sung cho khách hàng.',
    areaReviewSaved: 'Đã lưu đánh giá khu vực bay.',
    readinessSaved: 'Đã lưu tiêu chí.',
    rejectOrderTitle: 'Từ chối đơn?',
    rejectOrderBody:
      'Đơn sẽ bị từ chối và khách hàng sẽ nhận được lý do. Thao tác này không thể hoàn tác.',
    rejectOrderAction: 'Từ chối đơn',
    planFinalized: 'Kế hoạch đã được chốt.',
    planUpdated: 'Đã cập nhật kế hoạch.',
    missionCancelled: 'Đã hủy Mission.',
    paymentRefreshed: 'Đã cập nhật trạng thái đặt cọc.',
    checklistAssignmentSaved: 'Đã lưu phân công checklist.',
  },
  en: {
    orderApproved: 'Order approved.',
    orderRejected: 'Order rejected.',
    infoRequested: 'Information request sent to the customer.',
    areaReviewSaved: 'Flight area review saved.',
    readinessSaved: 'Criterion saved.',
    rejectOrderTitle: 'Reject this order?',
    rejectOrderBody:
      'The order will be rejected and the customer will receive the reason. This cannot be undone.',
    rejectOrderAction: 'Reject order',
    planFinalized: 'Plan finalized.',
    planUpdated: 'Plan updated.',
    missionCancelled: 'Mission cancelled.',
    paymentRefreshed: 'Deposit status updated.',
    checklistAssignmentSaved: 'Checklist assignment saved.',
  },
})
