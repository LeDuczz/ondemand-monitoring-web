import { defineMessages } from '../../../../../shared/i18n'

export const planningActionsMessages = defineMessages({
  vi: {
    addMission: 'Tạo thêm Mission',
    creatingMission: 'Đang tạo Mission',
    continueToResources: 'Tiếp: Gán nguồn lực',
    uncoveredHint: (n: number) =>
      `Còn ${n} checklist chưa gán cho Mission nào. Gán đủ rồi mới tiếp tục được.`,
    assignResourcesFor: 'Phân công nguồn lực cho',
    adjustPlan: 'Điều chỉnh kế hoạch',
  },
  en: {
    addMission: 'Add Mission',
    creatingMission: 'Creating Mission',
    continueToResources: 'Next: Assign resources',
    uncoveredHint: (n: number) =>
      `${n} checklist item(s) are not assigned to any Mission yet. Assign them all before continuing.`,
    assignResourcesFor: 'Assign resources for',
    adjustPlan: 'Adjust plan',
  },
})
