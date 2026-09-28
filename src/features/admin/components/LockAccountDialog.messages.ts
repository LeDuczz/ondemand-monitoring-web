import { defineMessages } from '../../../shared/i18n'

export const lockAccountDialogMessages = defineMessages({
  vi: {
    unlockTitle: 'Mở khoá tài khoản',
    lockTitle: 'Khoá tài khoản',
    close: 'Đóng',
    unlockConfirmPrefix: 'Mở khoá tài khoản',
    unlockConfirmSuffix: '? Tài khoản sẽ được đăng nhập lại.',
    lockConfirmPrefix: 'Khoá tài khoản',
    lockConfirmSuffix: '? Người dùng sẽ không thể đăng nhập.',
    lockWarning:
      'Cảnh báo: Nếu người dùng còn nhiệm vụ đang thực hiện, hãy kết thúc trước khi khoá.',
    cancel: 'Huỷ',
    processing: 'Đang xử lý...',
    unlockAction: 'Mở khoá',
    lockAction: 'Khoá',
    genericError: 'Lỗi khi thay đổi trạng thái.',
  },
  en: {
    unlockTitle: 'Unlock account',
    lockTitle: 'Lock account',
    close: 'Close',
    unlockConfirmPrefix: 'Unlock account',
    unlockConfirmSuffix: '? The account will be able to log in again.',
    lockConfirmPrefix: 'Lock account',
    lockConfirmSuffix: '? The user will no longer be able to log in.',
    lockWarning:
      'Warning: if the user still has a mission in progress, finish it before locking.',
    cancel: 'Cancel',
    processing: 'Processing...',
    unlockAction: 'Unlock',
    lockAction: 'Lock',
    genericError: 'Failed to change status.',
  },
})
