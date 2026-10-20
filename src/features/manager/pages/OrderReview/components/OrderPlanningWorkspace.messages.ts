import { defineMessages } from '../../../../../shared/i18n'

export const orderPlanningWorkspaceMessages = defineMessages({
  vi: {
    finalizeThePlan: 'Chốt kế hoạch?',
    sauKhiChotCauTruc:
      'Sau khi chốt, cấu trúc Mission và phân công checklist của phiên bản hiện tại sẽ được cố định.',
    chotKeHoach2: 'Chốt kế hoạch',
    adjustThePlan: 'Điều chỉnh kế hoạch?',
    cancelTheMission: 'Hủy Mission?',
    moPhienBanKeHoach:
      'Mở phiên bản kế hoạch mới để thay đổi cấu trúc Mission. Lịch sử vẫn được giữ nguyên.',
    theMissionWillBeCancelled: 'Mission sẽ được hủy và giữ lại trong lịch sử.',
    dieuChinhKeHoach2: 'Điều chỉnh kế hoạch',
    huyMission2: 'Hủy Mission',
    thePlanWasFinalizedSuccessfully: 'Kế hoạch đã được chốt thành công.',
    thePlanHasBeenUpdated: 'Đã cập nhật kế hoạch.',
    noQuoteAccepted:
      'Khách hàng chưa chấp nhận báo giá nên chưa có khoản đặt cọc để kiểm tra.',
    paymentReconciled:
      'Đã đối soát với VNPAY. Trạng thái đặt cọc đã được cập nhật.',
    saveChecklistFirst:
      'Bạn vừa thay đổi checklist. Hãy bấm “Lưu phân công” trước khi tiếp tục.',
    checklistNotCovered:
      'Còn checklist chưa được gán cho Mission. Hãy chọn các mục còn thiếu và bấm “Lưu phân công”, sau đó tiếp tục gán nguồn lực.',
  },
  en: {
    finalizeThePlan: 'Finalize the plan?',
    sauKhiChotCauTruc:
      'Once finalized, the Mission structure and checklist assignments of the current version are locked.',
    chotKeHoach2: 'Finalize plan',
    adjustThePlan: 'Adjust the plan?',
    cancelTheMission: 'Cancel the Mission?',
    moPhienBanKeHoach:
      'Open a new plan version to change the Mission structure. History is kept.',
    theMissionWillBeCancelled:
      'The Mission will be cancelled and kept in history.',
    dieuChinhKeHoach2: 'Adjust plan',
    huyMission2: 'Cancel Mission',
    thePlanWasFinalizedSuccessfully: 'The plan was finalized successfully.',
    thePlanHasBeenUpdated: 'The plan has been updated.',
    noQuoteAccepted:
      'The customer has not accepted the quote yet, so there is no deposit to check.',
    paymentReconciled:
      'Reconciled with VNPAY. The deposit status has been updated.',
    saveChecklistFirst:
      'You just changed the checklist. Click “Save assignment” before continuing.',
    checklistNotCovered:
      'Some checklist items are not assigned to a Mission yet. Select the missing items and click “Save assignment”, then continue to assign resources.',
  },
})
