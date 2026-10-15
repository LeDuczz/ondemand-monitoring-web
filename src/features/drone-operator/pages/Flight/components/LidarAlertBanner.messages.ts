import { defineMessages } from '../../../../../shared/i18n'

export const lidarAlertBannerMessages = defineMessages({
  vi: {
    unavailable: 'Không có dữ liệu LiDAR',
    stale: 'Dữ liệu LiDAR đã cũ',
    nearestObstacle: (display: string, direction: string) =>
      `Vật cản gần nhất: ${display} phía ${direction}`,
    noObstacle: 'Không có vật cản trong ngưỡng an toàn',
    holdPosition: 'Giữ vị trí hoặc tránh ngay lập tức.',
    proceedCaution: 'Di chuyển thận trọng.',
    sectorsClear: 'Các hướng đều an toàn hoặc ngoài phạm vi cảnh báo.',
  },
  en: {
    unavailable: 'LiDAR data unavailable',
    stale: 'LiDAR data stale',
    nearestObstacle: (display: string, direction: string) =>
      `Nearest obstacle: ${display} at ${direction}`,
    noObstacle: 'No obstacle within safety threshold',
    holdPosition: 'Hold position or avoid immediately.',
    proceedCaution: 'Proceed with caution.',
    sectorsClear: 'Directional sectors are clear or outside warning range.',
  },
})
