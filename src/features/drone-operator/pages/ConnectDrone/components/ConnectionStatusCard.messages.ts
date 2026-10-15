import { defineMessages } from '../../../../../shared/i18n'

export const connectionStatusCardMessages = defineMessages({
  vi: {
    trackerSteps: [
      'Xác thực operator',
      'Mở liên kết tới GCS',
      'Nhận heartbeat telemetry',
    ],
    connectionStatus: 'Trạng thái kết nối',
    badge: {
      connected: 'Đã kết nối',
      connecting: 'Đang kết nối',
      failed: 'Thất bại',
      default: 'Chưa kết nối',
    },
    heartbeatTelemetry: 'Heartbeat telemetry',
    telemetrySummary: (satellites: number) =>
      `telemetry_active = TRUE · pin thiết bị 100% · ${satellites} vệ tinh`,
  },
  en: {
    trackerSteps: [
      'Authenticate operator',
      'Open link to GCS',
      'Receive telemetry heartbeat',
    ],
    connectionStatus: 'Connection status',
    badge: {
      connected: 'Connected',
      connecting: 'Connecting',
      failed: 'Failed',
      default: 'Not connected',
    },
    heartbeatTelemetry: 'Heartbeat telemetry',
    telemetrySummary: (satellites: number) =>
      `telemetry_active = TRUE · device battery 100% · ${satellites} satellites`,
  },
})
