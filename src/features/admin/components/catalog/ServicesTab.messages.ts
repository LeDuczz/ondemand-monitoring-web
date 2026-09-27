import { defineMessages } from '../../../../shared/i18n'

export const servicesTabMessages = defineMessages({
  vi: {
    service: 'Dịch vụ',
    altRange: 'Độ cao min–max',
    sensorsRequired: 'Sensor yêu cầu (* bắt buộc)',
    minutes: (n: number) => `${n} phút`,
    editService: 'Sửa dịch vụ',
  },
  en: {
    service: 'Service',
    altRange: 'Altitude min–max',
    sensorsRequired: 'Required sensors (* mandatory)',
    minutes: (n: number) => `${n} min`,
    editService: 'Edit service',
  },
})
