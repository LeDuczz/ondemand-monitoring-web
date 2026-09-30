import { defineMessages } from '../../../shared/i18n'

export const droneApiMessages = defineMessages({
  vi: {
    unknownModel: 'Không rõ mẫu thiết bị',
    loadFailed: (status: number) =>
      `Không tải được danh sách thiết bị khả dụng (HTTP ${status})`,
  },
  en: {
    unknownModel: 'Unknown model',
    loadFailed: (status: number) =>
      `Failed to load available drones (HTTP ${status})`,
  },
})
