import { defineMessages } from '../../../shared/i18n'

export const orderWorkflowStepperMessages = defineMessages({
  vi: {
    ariaLabel: 'Các bước xử lý đơn hàng',
    steps: [
      { label: 'Xem đơn hàng', hint: 'Kiểm tra thông tin và yêu cầu' },
      { label: 'Lên lịch', hint: 'Thiết lập thời gian thực hiện' },
      { label: 'Gán nguồn lực', hint: 'Phân công thiết bị và nhân sự' },
      { label: 'Xác nhận', hint: 'Hoàn tất và gửi thông báo' },
    ],
  },
  en: {
    ariaLabel: 'Order processing steps',
    steps: [
      { label: 'Review order', hint: 'Check details and requirements' },
      { label: 'Schedule', hint: 'Set the execution time' },
      { label: 'Assign resources', hint: 'Assign equipment and staff' },
      { label: 'Confirm', hint: 'Finish and send notifications' },
    ],
  },
})
