import { defineMessages } from '../../../../../shared/i18n'

export const confirmStepMessages = defineMessages({
  vi: {
    readyToAssign: 'Sẵn sàng phân công',
    confirmBody:
      'Kiểm tra lại đơn hàng, nhiệm vụ, các vai trò đã phân công và thiết bị trước khi gửi phân công.',
    orderTitle: 'Yêu cầu khách hàng',
    missionImplementation: 'Nhiệm vụ triển khai',
    scheduleLabel: 'Lịch bay',
    roles: {
      PILOT: 'Phi công',
      OPERATOR: 'Vận hành',
      MAINTAINER: 'Bảo trì',
      INSPECTOR: 'Nghiệm thu',
    },
    notSelected: 'Chưa chọn',
    step2: 'Phân công thiết bị',
    checklist: 'Kiểm tra trước khi phân công',
    rolesComplete: 'Đã chọn đủ 4 vai trò',
    rolesMissing: (n: number) => `Thiếu ${n} vai trò`,
    deviceSelectedCount: (n: number) => `Đã chọn ${n} thiết bị`,
    deviceMissing: 'Chưa chọn thiết bị',
  },
  en: {
    readyToAssign: 'Ready to assign',
    confirmBody:
      'Review the order, mission role assignments, and device before submitting the assignment.',
    orderTitle: 'Customer request',
    missionImplementation: 'Mission implementation',
    scheduleLabel: 'Flight schedule',
    roles: {
      PILOT: 'Pilot',
      OPERATOR: 'Operator',
      MAINTAINER: 'Maintainer',
      INSPECTOR: 'Inspector',
    },
    notSelected: 'Not selected',
    step2: 'Device assignment',
    checklist: 'Pre-assignment checklist',
    rolesComplete: 'All 4 roles selected',
    rolesMissing: (n: number) => `${n} role(s) still missing`,
    deviceSelectedCount: (n: number) => `${n} device(s) selected`,
    deviceMissing: 'No device selected',
  },
})
