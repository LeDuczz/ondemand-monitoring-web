import { defineMessages } from '../../../shared/i18n'

export const paymentResultPageMessages = defineMessages({
  vi: {
    missingReference: 'Không tìm thấy mã thanh toán trong URL trả về.',
    checkFailed: 'Không thể kiểm tra thanh toán.',
    retryFailed: 'Không thể tạo lại thanh toán.',
  },
  en: {
    missingReference: 'No payment reference was found in the return URL.',
    checkFailed: 'Could not check the payment.',
    retryFailed: 'Could not create the payment again.',
  },
})
