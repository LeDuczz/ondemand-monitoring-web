import { defineMessages } from '../../../../../shared/i18n'

export const cancelModalMessages = defineMessages({
  vi: {
    cancelModal: {
      reasonRequired: 'Cần nhập lý do huỷ.',
      codeMismatch: (code: string) =>
        `Mã mission không khớp. Gõ đúng "${code}".`,
      ariaLabel: 'Huỷ mission',
    },
    missionChuaDuDieuKien:
      'Mission chưa đủ điều kiện hủy. Cần hoàn tất xác nhận an toàn và đóng phiên vận hành trước khi hủy.',
    thePlanMustBeReloaded: 'Cần tải lại kế hoạch trước khi hủy.',
  },
  en: {
    cancelModal: {
      reasonRequired: 'A cancellation reason is required.',
      codeMismatch: (code: string) =>
        `Mission code does not match. Type "${code}" exactly.`,
      ariaLabel: 'Cancel mission',
    },
    missionChuaDuDieuKien:
      'The Mission is not eligible for cancellation. Complete the safety confirmation and close the operating session before cancelling.',
    thePlanMustBeReloaded: 'The plan must be reloaded before cancelling.',
  },
})
