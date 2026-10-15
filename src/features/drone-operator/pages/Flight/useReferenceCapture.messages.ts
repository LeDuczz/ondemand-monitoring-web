import { defineMessages } from '../../../../shared/i18n'

export const referenceCaptureMessages = defineMessages({
  vi: {
    gettingPosition: 'Đang lấy vị trí drone...',
    cannotCapture: 'Không thể chụp ảnh tham chiếu.',
    saved: (distance: number | null) =>
      `Đã lưu ảnh tham chiếu${distance == null ? '' : ` · cách drone ${distance} m`}.`,
  },
  en: {
    gettingPosition: 'Getting drone position…',
    cannotCapture: 'Cannot capture reference image.',
    saved: (distance: number | null) =>
      `Reference image saved${distance == null ? '' : ` (${distance} m from drone)`}.`,
  },
})
