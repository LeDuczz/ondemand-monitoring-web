import { defineMessages } from '../../../../../shared/i18n'

export const missionDashboardMessages = defineMessages({
  vi: {
    tabOverview: 'Tổng quan',
    tabChecks: 'Kết quả kiểm tra thiết bị',
    tabMedia: 'Ảnh & video',
    pendingChecklistTitle: 'Checklist thực hiện',
    pendingChecklistHint:
      '🔒 Checklist sẽ được mở sau khi bạn chấp nhận nhiệm vụ. Bấm để xem trước.',
    actionBarLabel: 'Phản hồi nhiệm vụ',
    actionBarQuestion: 'Bạn có muốn nhận nhiệm vụ này?',
    noRespondPermission: 'Bạn chưa có quyền phản hồi nhiệm vụ này.',
    reject: 'Từ chối',
    processing: 'Đang xử lý...',
    acceptMission: '✓ Chấp nhận nhiệm vụ',
  },
  en: {
    tabOverview: 'Overview',
    tabChecks: 'Device check results',
    tabMedia: 'Photos & videos',
    pendingChecklistTitle: 'Execution checklist',
    pendingChecklistHint:
      '🔒 The checklist opens after you accept the mission. Click to preview.',
    actionBarLabel: 'Mission response',
    actionBarQuestion: 'Do you want to take this mission?',
    noRespondPermission:
      'You do not have permission to respond to this mission.',
    reject: 'Reject',
    processing: 'Processing...',
    acceptMission: '✓ Accept mission',
  },
})
