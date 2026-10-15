import { defineMessages } from '../../../../shared/i18n'

export const invoiceSectionMessages = defineMessages({
  vi: {
    invoice: (number: string) => `Hóa đơn ${number}`,
    depositInfo:
      'Khoản đặt cọc được xác nhận qua IPN VNPAY trước khi nhiệm vụ bắt đầu.',
    status: {
      ISSUED: 'Chờ thanh toán',
      PARTIALLY_PAID: 'Đã thanh toán một phần',
      PAID: 'Đã thanh toán',
      OVERDUE: 'Quá hạn',
      CANCELLED: 'Đã hủy',
      REFUNDED: 'Đã hoàn tiền',
    },
    total: 'Tổng',
    deposit: 'Tiền đặt cọc (30%)',
    paid: 'Đã thanh toán',
    remaining: 'Còn lại',
    awaitingDeposit: 'Đang chờ đặt cọc',
    awaitingDepositBody:
      'Kế hoạch thực hiện và Mission sẽ được mở sau khi khoản đặt cọc được xác nhận.',
    depositReceived: 'Đã nhận tiền đặt cọc',
    depositReceivedBody: 'Mission đã được mở khóa cho quy trình vận hành.',
    payDeposit: 'Thanh toán đặt cọc',
    payRemaining: 'Thanh toán phần còn lại',
  },
  en: {
    invoice: (number: string) => `Invoice ${number}`,
    depositInfo:
      'The deposit is confirmed through the VNPAY IPN before the mission starts.',
    status: {
      ISSUED: 'Awaiting payment',
      PARTIALLY_PAID: 'Partially paid',
      PAID: 'Paid',
      OVERDUE: 'Overdue',
      CANCELLED: 'Cancelled',
      REFUNDED: 'Refunded',
    },
    total: 'Total',
    deposit: 'Deposit (30%)',
    paid: 'Paid',
    remaining: 'Remaining',
    awaitingDeposit: 'Awaiting deposit',
    awaitingDepositBody:
      'The execution plan and Mission will open once the deposit is confirmed.',
    depositReceived: 'Deposit received',
    depositReceivedBody: 'The Mission is unlocked for the operations workflow.',
    payDeposit: 'Pay deposit',
    payRemaining: 'Pay remaining balance',
  },
})
