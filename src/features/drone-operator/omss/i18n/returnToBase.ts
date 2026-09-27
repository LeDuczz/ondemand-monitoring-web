import { defineMessages } from '../../../../shared/i18n'

export const returnToBaseMessages = defineMessages({
  vi: {
    phaseLabels: {
      rth: 'Đang quay về nhà',
      descend: 'Đang hạ độ cao',
      land: 'Đang hạ cánh',
      landed: 'Đã hạ cánh',
    },
    phases: {
      rth: 'Quay về',
      descend: 'Hạ độ cao',
      land: 'Hạ cánh',
      landed: 'Đã hạ cánh',
    },
    title: 'Quay về căn cứ',
    description: 'Drone đang thực hiện quy trình quay về nhà tự động.',
    telemetryUnavailable: 'Không có dữ liệu telemetry',
    distanceToHome: 'Khoảng cách về nhà',
    unavailable: 'Không có dữ liệu',
    telemetry: {
      altitude: 'Độ cao AGL',
      groundSpeed: 'Tốc độ mặt đất',
      battery: 'Pin',
      gpsSatellites: 'Vệ tinh GPS',
      signal: 'Tín hiệu (RSSI)',
      etaHome: 'Dự kiến về nhà',
    },
    landedLabel: 'Đã hạ cánh',
    droneLandedSuccessfully: '✓ Drone đã hạ cánh thành công',
    proceedingToPostflight: 'Đang chuyển sang kiểm tra sau bay…',
  },
  en: {
    phaseLabels: {
      rth: 'Returning to home',
      descend: 'Descending',
      land: 'Landing sequence',
      landed: 'Landed',
    },
    phases: {
      rth: 'Returning',
      descend: 'Descending',
      land: 'Landing',
      landed: 'Landed',
    },
    title: 'Return to base',
    description: 'Drone is executing autonomous return-to-home sequence.',
    telemetryUnavailable: 'Telemetry unavailable',
    distanceToHome: 'Distance to home',
    unavailable: 'Unavailable',
    telemetry: {
      altitude: 'Altitude AGL',
      groundSpeed: 'Ground speed',
      battery: 'Battery',
      gpsSatellites: 'GPS satellites',
      signal: 'Signal (RSSI)',
      etaHome: 'ETA home',
    },
    landedLabel: 'Landed',
    droneLandedSuccessfully: '✓ Drone landed successfully',
    proceedingToPostflight: 'Proceeding to post-flight inspection…',
  },
})
