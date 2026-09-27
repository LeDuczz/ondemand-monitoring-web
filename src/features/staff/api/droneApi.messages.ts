import { defineMessages } from '../../../shared/i18n'

export const droneApiMessages = defineMessages({
  vi: {
    unknownModel: 'Không rõ mẫu drone',
    loadFailed: (status: number) =>
      `Không tải được danh sách drone khả dụng (HTTP ${status})`,
  },
  en: {
    unknownModel: 'Unknown model',
    loadFailed: (status: number) =>
      `Failed to load available drones (HTTP ${status})`,
  },
})
