import { defineMessages } from '../../../../../shared/i18n'

export const rejectedCandidatesCardMessages = defineMessages({
  vi: {
    rejectedSummary: (drones: number, operators: number) =>
      `Đã bị loại ở hard filter · ${drones} drone · ${operators} phi công`,
    collapse: 'Thu gọn',
    expand: 'Mở ra',
    rejectedDrones: (n: number) => `Drone bị loại (${n})`,
    rejectedOperators: (n: number) => `Phi công bị loại (${n})`,
  },
  en: {
    rejectedSummary: (drones: number, operators: number) =>
      `Rejected by hard filter · ${drones} drones · ${operators} operators`,
    collapse: 'Collapse',
    expand: 'Expand',
    rejectedDrones: (n: number) => `Rejected drones (${n})`,
    rejectedOperators: (n: number) => `Rejected operators (${n})`,
  },
})
