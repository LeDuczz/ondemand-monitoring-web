import { defineMessages } from '../../../shared/i18n'

export const flightTelemetryHudMessages = defineMessages({
  vi: {
    uploadError: (msg: string) => `Lỗi upload ảnh: ${msg}`,
    stationTitle: (deviceCode: string, missionId: string) =>
      `Trạm Điều Khiển Chuyến Bay — ${deviceCode} (Mission ${missionId})`,
    altitudeLabel: 'ĐỘ CAO (ALTITUDE)',
    relativeAlt: 'Relative Alt (AGL)',
    speedLabel: 'VẬN TỐC (GROUND SPEED)',
    batteryLabel: 'MỨC PIN DRONE',
    uploadTitle: 'Upload Hình ảnh / Video Chụp từ Drone (Amazon S3 Direct)',
    uploadSuccess: 'Đã lưu tập tin lên S3 thành công!',
    chooseFile: 'Chọn ảnh/video...',
    uploading: '⏳ Đang tải lên...',
    uploadToS3: 'Tải lên S3 Cloud',
    returnToBase: '🚁 HẠ CÁNH / BAY VỀ TRẠM (RETURN TO BASE)',
  },
  en: {
    uploadError: (msg: string) => `Image upload error: ${msg}`,
    stationTitle: (deviceCode: string, missionId: string) =>
      `Flight Control Station — ${deviceCode} (Mission ${missionId})`,
    altitudeLabel: 'ALTITUDE',
    relativeAlt: 'Relative Alt (AGL)',
    speedLabel: 'GROUND SPEED',
    batteryLabel: 'DRONE BATTERY LEVEL',
    uploadTitle: 'Upload Drone Image / Video (Amazon S3 Direct)',
    uploadSuccess: 'File saved to S3 successfully!',
    chooseFile: 'Choose image/video...',
    uploading: '⏳ Uploading...',
    uploadToS3: 'Upload to S3 Cloud',
    returnToBase: '🚁 RETURN TO BASE',
  },
})
