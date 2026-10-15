import { defineMessages } from '../../../../../shared/i18n'

export const dispatchWizardViewMessages = defineMessages({
  vi: {
    orderFooterHint: 'Thông tin đơn hàng đã được duyệt, chỉ để đối chiếu.',
    missionFooterHint: 'Kiểm tra lịch bay đã tạo rồi sang bước Nhân sự.',
    staffFooterHint: 'Chọn đủ 4 vai trò rồi sang bước Thiết bị.',
    deviceFooterHint:
      'Chọn ít nhất một thiết bị khả dụng rồi sang bước Xác nhận.',
    footerHint:
      'Hệ thống sẽ khóa lịch nhân sự, gán thiết bị và chuyển nhiệm vụ sang bước chờ đội bay xác nhận.',
  },
  en: {
    orderFooterHint: 'You are creating a mission from the selected order.',
    missionFooterHint: 'Check the flight schedule, then continue to Staff.',
    staffFooterHint: 'Pick all 4 staff roles, then continue to Devices.',
    deviceFooterHint:
      'Pick at least one available device, then continue to Confirm.',
    footerHint:
      'The backend will lock staff schedules, assign the device, and move the mission to crew confirmation.',
  },
})
