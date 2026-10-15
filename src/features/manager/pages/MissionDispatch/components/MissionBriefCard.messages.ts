import { defineMessages } from '../../../../../shared/i18n'

export const missionBriefCardMessages = defineMessages({
  vi: {
    missionHeader: (code: string) => `Mission ${code}`,
    order: 'Order',
    attempt: (n: number) => `Lần thử ${n}`,
    time: 'Thời gian',
    location: 'Địa điểm',
    radius: (m: number) => ` · r ${m} m`,
    mediaRequirement: 'Yêu cầu media',
    requiredDuration: 'Thời lượng yêu cầu',
    requiredSensor: 'Cảm biến bắt buộc',
    servingStation: 'Trạm phục vụ',
  },
  en: {
    missionHeader: (code: string) => `Mission ${code}`,
    order: 'Order',
    attempt: (n: number) => `Attempt ${n}`,
    time: 'Time',
    location: 'Location',
    radius: (m: number) => ` · r ${m} m`,
    mediaRequirement: 'Media requirement',
    requiredDuration: 'Required duration',
    requiredSensor: 'Required sensor',
    servingStation: 'Serving station',
  },
})
