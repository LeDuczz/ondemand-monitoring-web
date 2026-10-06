import { defineMessages } from '../../../../../shared/i18n'

export const scheduleStepMessages = defineMessages({
  vi: {
    summaryTitle: 'Tóm tắt lịch bay',
    service: 'Dịch vụ',
    location: 'Địa điểm',
    area: 'Khu vực',
    dates: 'Ngày bay mong muốn',
    timeWindow: 'Khung giờ',
    notSelected: 'Chưa chọn',
    noAddress: 'Chưa chọn địa điểm',
    days: (n: number) => `${n} ngày`,
    radius: (m: number, ha: string) => `Bán kính ${m} m · ${ha} ha`,
  },
  en: {
    summaryTitle: 'Flight schedule summary',
    service: 'Service',
    location: 'Location',
    area: 'Area',
    dates: 'Preferred dates',
    timeWindow: 'Time window',
    notSelected: 'Not selected',
    noAddress: 'No location selected',
    days: (n: number) => `${n} day${n === 1 ? '' : 's'}`,
    radius: (m: number, ha: string) => `Radius ${m} m · ${ha} ha`,
  },
})
