import { defineMessages } from '../../../../shared/i18n'

export const safeStopPanelMessages = defineMessages({
  vi: {
    safetyConfirmationSent: 'Đã gửi xác nhận an toàn.',
    actionRecorded: 'Thao tác đã được ghi nhận.',
    dungMissionAnToan: (a0: string | number | null | undefined) =>
      `Dừng Mission an toàn ${a0}`,
    dungMissionAnToan2: 'Dừng Mission an toàn',
    loadingStatus: 'Đang tải trạng thái…',
    khongTheXacMinhTrang:
      'Không thể xác minh trạng thái của Mission này. Vui lòng làm mới.',
    reasonForStoppingCancellingThe: 'Lý do dừng / hủy Mission',
    safetyRecord: 'Ghi nhận an toàn',
    dangChoNguoiDuocPhan:
      'Đang chờ người được phân công xác nhận an toàn. Bạn chưa thể xác nhận lúc này.',
    requestSafeStop: 'Yêu cầu dừng an toàn',
    chiXacNhanSauKhi:
      'Chỉ xác nhận sau khi drone đã hạ cánh, dừng động cơ và kết thúc điều khiển.',
    describeTheSafetyStatusYou: 'Mô tả tình trạng an toàn đã kiểm tra',
    toiDaKiemTraDrone:
      'Tôi đã kiểm tra: drone đã hạ cánh, dừng động cơ và kết thúc điều khiển.',
    confirmSafe: 'Xác nhận đã an toàn',
    releaseThisMissionSDevices:
      'Giải phóng thiết bị và nhân sự của Mission này?',
    releaseResources: 'Giải phóng tài nguyên',
  },
  en: {
    safetyConfirmationSent: 'Safety confirmation sent.',
    actionRecorded: 'Action recorded.',
    dungMissionAnToan: (a0: string | number | null | undefined) =>
      `Safe stop Mission ${a0}`,
    dungMissionAnToan2: 'Safe stop Mission',
    loadingStatus: 'Loading status…',
    khongTheXacMinhTrang:
      "Could not verify this Mission's status. Please refresh.",
    reasonForStoppingCancellingThe:
      'Reason for stopping / cancelling the Mission',
    safetyRecord: 'Safety record',
    dangChoNguoiDuocPhan:
      'Waiting for the assignee to confirm safety. You cannot confirm right now.',
    requestSafeStop: 'Request safe stop',
    chiXacNhanSauKhi:
      'Only confirm after the drone has landed, the motors have stopped and control has ended.',
    describeTheSafetyStatusYou: 'Describe the safety status you checked',
    toiDaKiemTraDrone:
      'I checked: the drone has landed, the motors have stopped and control has ended.',
    confirmSafe: 'Confirm safe',
    releaseThisMissionSDevices: "Release this Mission's devices and staff?",
    releaseResources: 'Release resources',
  },
})
