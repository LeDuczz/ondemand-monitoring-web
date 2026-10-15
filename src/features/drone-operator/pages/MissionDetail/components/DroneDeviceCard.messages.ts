import { defineMessages } from '../../../../../shared/i18n'

export const droneDeviceCardMessages = defineMessages({
  vi: {
    title: 'Thiết bị thực hiện',
    noDeviceAssigned: 'Chưa gán thiết bị',
    status: 'Trạng thái',
    droneName: 'Tên drone',
    manufacturer: 'Hãng',
    station: 'Trạm',
    stationDistance: 'Khoảng cách trạm',
    readiness: 'Sẵn sàng',
    hoursSinceMaintenanceLabel: 'Giờ bay từ bảo trì',
    hourUnit: 'giờ',
    noTelemetry: 'Chưa có telemetry',
    readyPercent: (pct: number) => `${pct}% Sẵn sàng`,
    pickupAt: 'Lấy tại',
    distanceWord: 'cách',
    hoursSinceMaintenance: (hours: number) => `${hours} giờ bay từ lần bảo trì`,
  },
  en: {
    title: 'Assigned device',
    noDeviceAssigned: 'No device assigned',
    status: 'Status',
    droneName: 'Drone name',
    manufacturer: 'Manufacturer',
    station: 'Station',
    stationDistance: 'Station distance',
    readiness: 'Readiness',
    hoursSinceMaintenanceLabel: 'Flight hours since maintenance',
    hourUnit: 'h',
    noTelemetry: 'No telemetry yet',
    readyPercent: (pct: number) => `${pct}% ready`,
    pickupAt: 'Pick up at',
    distanceWord: 'distance',
    hoursSinceMaintenance: (hours: number) =>
      `${hours}h flown since last maintenance`,
  },
})
