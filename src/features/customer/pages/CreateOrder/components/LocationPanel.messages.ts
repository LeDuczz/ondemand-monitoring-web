import { defineMessages } from '../../../../../shared/i18n'

export const locationPanelMessages = defineMessages({
  vi: {
    cardTitle: 'Vị trí và bán kính',
    addressLabel: 'Địa chỉ/khu vực',
    addressPlaceholder: 'VD: KCN Long Hậu, Cần Giuộc, Long An',
    latitudeLabel: 'Sim Y / Latitude',
    longitudeLabel: 'Sim X / Longitude',
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
    latitudeLabel: 'Sim Y / Latitude',
    longitudeLabel: 'Sim X / Longitude',
    radiusLabel: (radius: number) => `Monitoring radius: ${radius} m`,
    areaEstimate: 'Estimated area',
    monitoringZone: 'Monitoring zone',
    outsideZoneValue: 'Outside zone',
    checkedValue: 'Checked',
  },
})
