import { defineMessages } from '../../../../../shared/i18n'

export const managerMissionStopFlowMessages = defineMessages({
  vi: {
    releaseResources: 'Giải phóng tài nguyên?',
    cancelTheMission: 'Hủy Mission?',
    releaseDevicesAndStaffOf: (a0: string | number | null | undefined) =>
      `Giải phóng thiết bị và nhân sự của ${a0}.`,
    huyVaGiuLaiLich: (a0: string | number | null | undefined) =>
      `Hủy ${a0} và giữ lại lịch sử.`,
    giaiPhongTaiNguyen2: 'Giải phóng tài nguyên',
    huyMission2: 'Hủy Mission',
    actionRecorded: 'Thao tác đã được ghi nhận.',
  },
  en: {
    releaseResources: 'Release resources?',
    cancelTheMission: 'Cancel the Mission?',
    releaseDevicesAndStaffOf: (a0: string | number | null | undefined) =>
      `Release devices and staff of ${a0}.`,
    huyVaGiuLaiLich: (a0: string | number | null | undefined) =>
      `Cancel ${a0} and keep history.`,
    giaiPhongTaiNguyen2: 'Release resources',
    huyMission2: 'Cancel Mission',
    actionRecorded: 'Action recorded.',
  },
})
