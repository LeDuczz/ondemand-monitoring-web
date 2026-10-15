import { defineMessages } from '../../../../shared/i18n'

export const missionSelectionCardMessages = defineMessages({
  vi: {
    selectAMissionToAssign: 'Chọn nhiệm vụ để phân công',
    refreshMissions: 'Làm mới nhiệm vụ',
    loadingMissions: 'Đang tải nhiệm vụ…',
    historyViewOnly: 'Lịch sử · chỉ xem',
    resourcesAssigned: 'Đã phân công nguồn lực',
    planNotFinalized: 'Chưa chốt kế hoạch',
    notEligibleForAssignment: 'Chưa đủ điều kiện phân công',
    awaitingAssignmentConfirmation: 'Chờ xác nhận phân công',
    daPhanCong4Vai: (a0: string | number | null | undefined) =>
      `Đã phân công ${a0}/4 vai trò`,
  },
  en: {
    selectAMissionToAssign: 'Select a mission to assign',
    refreshMissions: 'Refresh missions',
    loadingMissions: 'Loading missions…',
    historyViewOnly: 'History · view only',
    resourcesAssigned: 'Resources assigned',
    planNotFinalized: 'Plan not finalized',
    notEligibleForAssignment: 'Not eligible for assignment',
    awaitingAssignmentConfirmation: 'Awaiting assignment confirmation',
    daPhanCong4Vai: (a0: string | number | null | undefined) =>
      `Assigned ${a0}/4 roles`,
  },
})
