import { defineMessages } from '../../../../../shared/i18n'

export const orderApprovalActionsMessages = defineMessages({
  vi: {
    actionHintNext:
      'Sau khi duyệt, hệ thống sẽ chuyển sang bước Lên lịch để thiết lập thời gian, gán nguồn lực và xác nhận thực hiện nhiệm vụ.',
    requestInfoDisabled: 'Backend chưa hỗ trợ yêu cầu bổ sung thông tin',
    requestInfo: 'Yêu cầu bổ sung',
    reject: 'Từ chối',
  },
  en: {
    actionHintNext:
      'After approval, the system moves to the Schedule step to set the time, assign resources and confirm the mission.',
    requestInfoDisabled:
      'Backend does not support requesting more information yet',
    requestInfo: 'Request more info',
    reject: 'Reject',
  },
})
