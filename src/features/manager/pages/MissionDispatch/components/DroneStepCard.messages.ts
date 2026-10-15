import { defineMessages } from '../../../../../shared/i18n'

export const droneStepCardMessages = defineMessages({
  vi: {
    step1Choose: 'Bước 1 — Chọn drone',
    topOf: (top: number, eligible: number) =>
      `top ${top} / ${eligible} đủ điều kiện`,
  },
  en: {
    step1Choose: 'Step 1 — Choose a drone',
    topOf: (top: number, eligible: number) =>
      `top ${top} / ${eligible} eligible`,
  },
})
