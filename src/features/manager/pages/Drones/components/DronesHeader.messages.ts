import { defineMessages } from '../../../../../shared/i18n'

export const dronesHeaderMessages = defineMessages({
  vi: {
    summary: (
      available: number,
      flying: number,
      maintenance: number,
      outOfService: number,
    ) =>
      `${available} sẵn sàng · ${flying} đang bay · ${maintenance} bảo trì · ${outOfService} ngừng dùng`,
  },
  en: {
    summary: (
      available: number,
      flying: number,
      maintenance: number,
      outOfService: number,
    ) =>
      `${available} available · ${flying} flying · ${maintenance} maintenance · ${outOfService} out of service`,
  },
})
