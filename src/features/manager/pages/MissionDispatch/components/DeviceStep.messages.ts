import { defineMessages } from '../../../../../shared/i18n'

export const deviceStepMessages = defineMessages({
  vi: {
    step2: 'Phân công thiết bị',
    deviceSelectedCount: (n: number) => `Đã chọn ${n} thiết bị`,
    deviceHelp:
      'Chọn một hoặc nhiều thiết bị sẵn sàng để gán cho nhiệm vụ. Các thiết bị được chọn sẽ dùng xuyên suốt luồng bay.',
    deviceAvailabilityHint:
      'Chỉ hiển thị thiết bị khả dụng trong thời gian thực hiện Mission.',
    noAvailableDrones:
      'Không có thiết bị khả dụng trong khung giờ Mission này.',
    selectedDevice: 'Thiết bị đã chọn',
    chooseDroneOption: 'Chọn thiết bị',
  },
  en: {
    step2: 'Device assignment',
    deviceSelectedCount: (n: number) => `${n} device(s) selected`,
    deviceHelp:
      'Choose one or more AVAILABLE devices for this mission. Selected devices will be used through the flight flow.',
    deviceAvailabilityHint:
      'Only devices available during this Mission interval are shown.',
    noAvailableDrones: 'No devices are available during this Mission interval.',
    selectedDevice: 'Selected device',
    chooseDroneOption: 'Choose a device',
  },
})
