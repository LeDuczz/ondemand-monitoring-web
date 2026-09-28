import { defineMessages } from '../../../shared/i18n'

export const activeFlightScreenMessages = defineMessages({
  vi: {
    opening: 'Đang mở buồng lái...',
    backToMissions: 'Về Mission của tôi',
    throughPreflight: 'Qua Preflight',
    loadMissionFailed: 'Không tải được mission',
    cockpitOpenFailed: 'Không mở được buồng lái',
    backToMission: 'Quay lại Mission',
    noDroneTitle: 'Mission chưa có drone',
    noDroneMessage:
      'Mission này chưa được gán drone nên chưa thể mở buồng lái. Hãy quay lại danh sách mission hoặc yêu cầu quản lý gán drone trước.',
    rtbFailed: 'Không chuyển được mission sang RETURNING',
    emergencyPrompt: 'Lý do kết thúc khẩn cấp',
    emergencyUpdateFailed: 'Không cập nhật được mission',
  },
  en: {
    opening: 'Opening the cockpit...',
    backToMissions: 'Back to my missions',
    throughPreflight: 'Go to preflight',
    loadMissionFailed: 'Could not load the mission',
    cockpitOpenFailed: 'Could not open the cockpit',
    backToMission: 'Back to mission',
    noDroneTitle: 'Mission has no drone',
    noDroneMessage:
      'This mission has no drone assigned yet, so the cockpit cannot open. Go back to the mission list or ask a manager to assign a drone first.',
    rtbFailed: 'Could not move the mission to RETURNING',
    emergencyPrompt: 'Reason for emergency termination',
    emergencyUpdateFailed: 'Could not update the mission',
  },
})
