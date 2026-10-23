import { defineMessages } from '../../../../../shared/i18n'

export const orderOverviewVisualCardMessages = defineMessages({
  vi: {
    sectionLabel: 'Tổng quan dịch vụ và vị trí',
    selectedService: 'Dịch vụ đã chọn',
    street: 'Bản đồ',
    satellite: 'Vệ tinh',
    mapLabel: 'Bản đồ khu vực giám sát',
    noCoordinates: 'Đơn hàng chưa có tọa độ khu vực giám sát.',
    locationFallback: 'Vị trí giám sát',
    radius: (m: number) => `Phạm vi ${m} m`,
    noRadius: 'Chưa có bán kính',
  },
  en: {
    sectionLabel: 'Service and location overview',
    selectedService: 'Selected service',
    street: 'Map',
    satellite: 'Satellite',
    mapLabel: 'Monitoring area map',
    noCoordinates: 'This order has no monitoring-area coordinates yet.',
    locationFallback: 'Monitoring location',
    radius: (m: number) => `Radius ${m} m`,
    noRadius: 'No radius',
  },
})
