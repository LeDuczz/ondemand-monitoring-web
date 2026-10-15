import { defineMessages } from '../../../../shared/i18n'

export const geofenceMessages = defineMessages({
  vi: {
    restrictedZoneFallback: 'khu vực hạn chế',
    breach: (zone: string) => `Xâm phạm khu vực hạn chế: ${zone}`,
    danger: (distance: number, zone: string) =>
      `Nguy hiểm khu vực hạn chế: cách ${distance} m từ ${zone}`,
    caution: (distance: number, zone: string) =>
      `Cảnh báo khu vực hạn chế: cách ${distance} m từ ${zone}`,
    allNominal: 'Hệ thống hoạt động bình thường',
  },
  en: {
    restrictedZoneFallback: 'restricted zone',
    breach: (zone: string) => `Restricted zone breach: ${zone}`,
    danger: (distance: number, zone: string) =>
      `Restricted zone danger: ${distance} m from ${zone}`,
    caution: (distance: number, zone: string) =>
      `Restricted zone caution: ${distance} m from ${zone}`,
    allNominal: 'All Systems Nominal',
  },
})
