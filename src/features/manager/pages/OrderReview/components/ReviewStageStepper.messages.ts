import { defineMessages } from '../../../../../shared/i18n'

export const reviewStageStepperMessages = defineMessages({
  vi: {
    orderReviewSteps: 'Các bước review đơn',
    finishTheOrderReviewTo: 'Hoàn tất duyệt đơn để mở bước này',
    steps: [
      { label: 'Thông tin đơn', hint: 'Hồ sơ và vị trí' },
      { label: 'Kiểm tra vùng', hint: 'Bản đồ và cảnh báo' },
      { label: 'Điều kiện duyệt', hint: 'Kiểm tra và xác nhận' },
      { label: 'Checklist & báo giá', hint: 'Phân loại và quyết định' },
      { label: 'Lên lịch', hint: 'Thời gian thực hiện' },
      { label: 'Gán nguồn lực', hint: 'Thiết bị và nhân sự' },
      { label: 'Xác nhận', hint: 'Hoàn tất kế hoạch' },
    ],
  },
  en: {
    orderReviewSteps: 'Order review steps',
    finishTheOrderReviewTo: 'Finish the order review to unlock this step',
    steps: [
      { label: 'Order info', hint: 'Profile and location' },
      { label: 'Area check', hint: 'Map and warnings' },
      { label: 'Approval criteria', hint: 'Check and confirm' },
      { label: 'Checklist & quote', hint: 'Classify and decide' },
      { label: 'Schedule', hint: 'Execution time' },
      { label: 'Assign resources', hint: 'Equipment and staff' },
      { label: 'Confirm', hint: 'Finalise the plan' },
    ],
  },
})
