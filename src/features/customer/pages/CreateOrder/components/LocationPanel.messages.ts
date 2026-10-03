import { defineMessages } from '../../../../../shared/i18n'

export const locationPanelMessages = defineMessages({
  vi: {
    cardTitle: 'Vị trí và bán kính',
    addressLabel: 'Địa chỉ/khu vực',
    addressPlaceholder: 'VD: KCN Long Hậu, Cần Giuộc, Long An',
    locateAddress: 'Tìm trên bản đồ',
    locatingAddress: 'Đang tìm...',
    addressNotFound: 'Không tìm thấy địa chỉ này.',
    latitudeLabel: 'Vĩ độ GPS',
    longitudeLabel: 'Kinh độ GPS',
    radiusLabel: (radius: number) => `Bán kính giám sát: ${radius} m`,
    areaEstimate: 'Diện tích ước tính',
    monitoringZone: 'Vùng giám sát',
    outsideZoneValue: 'Ngoài vùng',
    checkedValue: 'Đã kiểm tra',
  },
  en: {
    cardTitle: 'Location and radius',
    addressLabel: 'Address/area',
    addressPlaceholder: 'E.g. Long Hau Industrial Park, Can Giuoc, Long An',
    locateAddress: 'Find on map',
    locatingAddress: 'Searching...',
    addressNotFound: 'Address not found.',
    latitudeLabel: 'GPS latitude',
    longitudeLabel: 'GPS longitude',
    radiusLabel: (radius: number) => `Monitoring radius: ${radius} m`,
    areaEstimate: 'Estimated area',
    monitoringZone: 'Monitoring zone',
    outsideZoneValue: 'Outside zone',
    checkedValue: 'Checked',
  },
})
