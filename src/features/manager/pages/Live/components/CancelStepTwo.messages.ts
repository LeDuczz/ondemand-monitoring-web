import { defineMessages } from '../../../../../shared/i18n'

export const cancelStepTwoMessages = defineMessages({
  vi: {
    cancelModal: {
      step2Title: 'Xác nhận huỷ mission',
      step2Body: 'Gõ mã mission để xác nhận huỷ:',
      confirmCodeLabel: 'Mã xác nhận',
      back: '← Quay lại',
      cancelling: 'Đang huỷ…',
      confirmCancel: 'Huỷ mission',
    },
    viewOrderPlan: 'Xem kế hoạch Order',
  },
  en: {
    cancelModal: {
      step2Title: 'Confirm mission cancellation',
      step2Body: 'Type the mission code to confirm cancellation:',
      confirmCodeLabel: 'Confirmation code',
      back: '← Back',
      cancelling: 'Cancelling…',
      confirmCancel: 'Cancel mission',
    },
    viewOrderPlan: 'View Order plan',
  },
})
