import { defineMessages } from '../../../../../shared/i18n'

export const dispatchSidebarMessages = defineMessages({
  vi: {
    summaryTitle: 'Tóm tắt nhiệm vụ',
    selectionTitle: 'Lựa chọn hiện tại',
    mission: 'Nhiệm vụ',
    order: 'Yêu cầu khách hàng',
    customer: 'Khách hàng',
    schedule: 'Lịch bay',
    devices: 'Thiết bị',
    notSelected: 'Chưa chọn',
    roles: {
      PILOT: 'Phi công',
      OPERATOR: 'Vận hành',
      MAINTAINER: 'Bảo trì',
      INSPECTOR: 'Nghiệm thu',
    },
    rolesComplete: 'Đã chọn đủ 4 vai trò',
    rolesMissing: (n: number) => `Thiếu ${n} vai trò`,
    deviceSelectedCount: (n: number) => `Đã chọn ${n} thiết bị`,
    deviceMissing: 'Chưa chọn thiết bị',
  },
  en: {
    summaryTitle: 'Mission summary',
    selectionTitle: 'Current selection',
    mission: 'Mission',
    order: 'Customer request',
    customer: 'Customer',
    schedule: 'Flight schedule',
    devices: 'Devices',
    notSelected: 'Not selected',
    roles: {
      PILOT: 'Pilot',
      OPERATOR: 'Operator',
      MAINTAINER: 'Maintainer',
      INSPECTOR: 'Inspector',
    },
    rolesComplete: 'All 4 roles selected',
    rolesMissing: (n: number) => `${n} role(s) still missing`,
    deviceSelectedCount: (n: number) => `${n} device(s) selected`,
    deviceMissing: 'No device selected',
  },
})
