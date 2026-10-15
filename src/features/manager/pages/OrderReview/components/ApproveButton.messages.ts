import { defineMessages } from '../../../../../shared/i18n'

export const approveButtonMessages = defineMessages({
  vi: {
    approveFailed: 'Duyệt đơn thất bại, thử lại.',
    approveAndCreateMission: 'Duyệt & lên lịch',
    approveTitle: 'Duyệt đơn hàng?',
    approveHint:
      'Hệ thống sẽ tạo mission và giữ manager trong luồng thiết lập.',
    approveChecklist: [
      'Tạo Mission tự động',
      'Sao chép khu vực',
      'Sao chép yêu cầu',
      'Sao chép thời gian mong muốn',
    ],
    approveCancel: 'Hủy',
    approving: 'Đang duyệt...',
    approveContinue: 'Duyệt & tiếp tục',
  },
  en: {
    approveFailed: 'Approving the order failed, try again.',
    approveAndCreateMission: 'Approve & schedule',
    approveTitle: 'Approve this order?',
    approveHint:
      'The system will create a mission and keep the manager in the setup flow.',
    approveChecklist: [
      'Create the Mission automatically',
      'Copy the area',
      'Copy the requirements',
      'Copy the preferred time',
    ],
    approveCancel: 'Cancel',
    approving: 'Approving...',
    approveContinue: 'Approve & continue',
  },
})
