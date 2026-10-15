import { defineMessages } from '../../../../../shared/i18n'

export const assignModalMessages = defineMessages({
  vi: {
    assignModal: {
      title: 'Phân công System Operator',
      failed: 'Không thể gán System Operator',
      ticketLabel: 'Ticket: ',
      droneLabel: ' · Drone: ',
      chooseOperator: 'Chọn System Operator phụ trách',
      cancel: 'Hủy',
      assigning: 'Đang phân công...',
      confirm: 'Xác nhận Phân công',
    },
  },
  en: {
    assignModal: {
      title: 'Assign operator',
      failed: 'Could not assign the operator',
      ticketLabel: 'Ticket: ',
      droneLabel: ' · Drone: ',
      chooseOperator: 'Choose the assigned operator',
      cancel: 'Cancel',
      assigning: 'Assigning...',
      confirm: 'Confirm assignment',
    },
  },
})
