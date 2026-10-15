import { defineMessages } from '../../../../../shared/i18n'

export const readinessHeaderMessages = defineMessages({
  vi: {
    approvalConditions: 'Điều kiện duyệt',
    conMucManagerCanXac: (a0: string | number | null | undefined) =>
      `Còn ${a0} mục manager cần xác nhận`,
  },
  en: {
    approvalConditions: 'Approval conditions',
    conMucManagerCanXac: (a0: string | number | null | undefined) =>
      `${a0} items the manager must confirm remain`,
  },
})
