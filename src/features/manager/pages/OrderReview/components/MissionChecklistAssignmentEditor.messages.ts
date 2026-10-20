import { defineMessages } from '../../../../../shared/i18n'

export const missionChecklistAssignmentEditorMessages = defineMessages({
  vi: {
    checklistAssignmentSaved: 'Đã lưu phân công checklist.',
    checklist: 'Checklist ·',
    selectedCount: (n: number, total: number) =>
      `${n}/${total} mục được chọn`,
    itemCount: (n: number | string) => `${n} mục`,
    selectAll: 'Chọn tất cả',
    deselectAll: 'Bỏ chọn',
    loadingAssignment: 'Đang tải phân công…',
    reload: 'Tải lại',
    assigned: 'Đã phân công',
    noChecklistAssignedYet: 'Chưa có checklist được phân công.',
    serviceTemplate: 'Mẫu dịch vụ',
    customerAdded: 'Khách hàng bổ sung',
    noChecklistRequirementYet: 'Chưa có yêu cầu checklist.',
    saving: 'Đang lưu…',
    saveAssignment: 'Lưu phân công',
  },
  en: {
    checklistAssignmentSaved: 'Checklist assignment saved.',
    checklist: 'Checklist ·',
    selectedCount: (n: number, total: number) => `${n}/${total} selected`,
    itemCount: (n: number | string) => `${n} items`,
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    loadingAssignment: 'Loading assignment…',
    reload: 'Reload',
    assigned: 'Assigned',
    noChecklistAssignedYet: 'No checklist assigned yet.',
    serviceTemplate: 'Service template',
    customerAdded: 'Customer added',
    noChecklistRequirementYet: 'No checklist requirement yet.',
    saving: 'Saving…',
    saveAssignment: 'Save assignment',
  },
})
