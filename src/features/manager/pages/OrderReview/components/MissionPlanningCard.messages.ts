import { defineMessages } from '../../../../../shared/i18n'

export const missionPlanningCardMessages = defineMessages({
  vi: {
    unknownStatus: 'Chưa xác định',
    finalizedAt: (revision: number | string) =>
      `Đã chốt tại phiên bản ${revision}`,
    orderScope: 'Phạm vi theo đơn hàng',
    device: 'Thiết bị',
    notAssigned: 'Chưa phân công',
    staff: 'Nhân sự',
    noName: 'Chưa có tên',
    missionHistory: 'Lịch sử Mission',
    replaces: 'Thay thế cho',
    previousMission: 'Mission trước',
    replacedBy: 'Được thay thế bởi',
    replacementMission: 'Mission thay thế',
  },
  en: {
    unknownStatus: 'Unknown',
    finalizedAt: (revision: number | string) =>
      `Finalized at revision ${revision}`,
    orderScope: 'Order scope',
    device: 'Device',
    notAssigned: 'Not assigned',
    staff: 'Staff',
    noName: 'No name',
    missionHistory: 'Mission history',
    replaces: 'Replaces',
    previousMission: 'Previous mission',
    replacedBy: 'Replaced by',
    replacementMission: 'Replacement mission',
  },
})
