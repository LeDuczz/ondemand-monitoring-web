import { defineMessages } from '../../../../../shared/i18n'

export const cameraStatusPanelMessages = defineMessages({
  vi: {
    thermal: 'Nhiệt',
    downward: 'Hướng xuống',
    fpv: 'FPV',
    gimbal: 'Gimbal',
    heatMap: 'Bản đồ nhiệt',
    pitch: (deg: number) => `Góc nghiêng ${deg}°`,
    camera: 'Camera',
    view: 'Chế độ xem',
    mode: 'Chế độ',
    manual: 'Thủ công',
  },
  en: {
    thermal: 'Thermal',
    downward: 'Downward',
    fpv: 'FPV',
    gimbal: 'Gimbal',
    heatMap: 'Heat Map',
    pitch: (deg: number) => `${deg}° pitch`,
    camera: 'Camera',
    view: 'View',
    mode: 'Mode',
    manual: 'Manual',
  },
})
