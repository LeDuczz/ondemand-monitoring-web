import { defineMessages } from '../../../../../shared/i18n'

export const modeSelectorMessages = defineMessages({
  vi: {
    modeLabel: { AVAILABLE: 'Rảnh', BUSY: 'Bận', OFF: 'Nghỉ' },
    declarePrefix: 'Khai báo:',
    selectionCount: (count: number) => `Kéo trên lưới... đang chọn ${count} ô`,
    deselect: 'Bỏ chọn',
    apply: 'Áp dụng',
  },
  en: {
    modeLabel: { AVAILABLE: 'Available', BUSY: 'Busy', OFF: 'Off' },
    declarePrefix: 'Set:',
    selectionCount: (count: number) =>
      `Drag on the grid... ${count} cells selected`,
    deselect: 'Deselect',
    apply: 'Apply',
  },
})
