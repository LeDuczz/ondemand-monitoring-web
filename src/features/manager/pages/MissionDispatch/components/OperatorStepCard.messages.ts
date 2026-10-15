import { defineMessages } from '../../../../../shared/i18n'

export const operatorStepCardMessages = defineMessages({
  vi: {
    step2Choose: 'Bước 2 — Chọn phi công',
    topOf: (top: number, eligible: number) =>
      `top ${top} / ${eligible} đủ điều kiện`,
  },
  en: {
    step2Choose: 'Step 2 — Choose a pilot',
    topOf: (top: number, eligible: number) =>
      `top ${top} / ${eligible} eligible`,
  },
})
