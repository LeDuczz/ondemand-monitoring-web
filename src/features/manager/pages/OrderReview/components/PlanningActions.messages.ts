import { defineMessages } from '../../../../../shared/i18n'

export const planningActionsMessages = defineMessages({
  vi: {
    creating: 'Đang tạo Mission',
    addMission: 'Tạo thêm Mission',
    uncoveredHint: (n: number) =>
      `Còn ${n} checklist chưa gán cho Mission nào. Gán đủ rồi mới tiếp tục được.`,
    nextAssignResources: 'Tiếp: Gán nguồn lực',
    adjustPlan: 'Điều chỉnh kế hoạch',
    assignResourcesFor: 'Phân công nguồn lực cho',
  },
  en: {
    creating: 'Creating Mission',
    addMission: 'Add Mission',
    uncoveredHint: (n: number) =>
      `${n} checklist item(s) are not assigned to any Mission yet. Assign them all before continuing.`,
    nextAssignResources: 'Next: Assign resources',
    adjustPlan: 'Adjust plan',
    assignResourcesFor: 'Assign resources for',
  },
})
