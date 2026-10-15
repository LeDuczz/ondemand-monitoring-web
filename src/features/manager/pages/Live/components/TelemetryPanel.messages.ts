import { defineMessages } from '../../../../../shared/i18n'

export const telemetryPanelMessages = defineMessages({
  vi: {
    telemetry: {
      batteryLossHint: '↓ 1%/phút',
      battery: 'Pin',
      flightTime: 'Thời gian bay',
      altitude: 'Độ cao',
      speed: 'Tốc độ',
      satellites: 'Vệ tinh',
      gps: 'GPS',
    },
    connectionStatus: 'connection_status',
    telemetryActive: 'telemetry_active',
  },
  en: {
    telemetry: {
      batteryLossHint: '↓ 1%/min',
      battery: 'Battery',
      flightTime: 'Flight time',
      altitude: 'Altitude',
      speed: 'Speed',
      satellites: 'Satellites',
      gps: 'GPS',
    },
    connectionStatus: 'connection_status',
    telemetryActive: 'telemetry_active',
  },
})
