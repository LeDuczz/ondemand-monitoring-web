import { defineMessages } from '../../../../../shared/i18n'

export const dispatchBodyMessages = defineMessages({
  vi: {
    cannotSelectDrone: 'Không thể chọn drone này.',
    assignSuccess: (name: string) =>
      `Đã phân công thành công. Phi công ${name} đã được gán. Thông báo đã gửi tới phi công (chờ phản hồi).`,
    assignFailed: 'Phân công thất bại.',
    autoAssignSuccess: (droneName: string, operatorName: string) =>
      `Đã phân công tự động thành công. Drone ${droneName} + phi công ${operatorName} đã được gán. Thông báo đã gửi tới phi công.`,
  },
  en: {
    cannotSelectDrone: 'Could not select this drone.',
    assignSuccess: (name: string) =>
      `Assigned successfully. Pilot ${name} has been assigned. A notification has been sent to the pilot (awaiting response).`,
    assignFailed: 'Assignment failed.',
    autoAssignSuccess: (droneName: string, operatorName: string) =>
      `Auto-assigned successfully. Drone ${droneName} + pilot ${operatorName} have been assigned. A notification has been sent to the pilot.`,
  },
})
