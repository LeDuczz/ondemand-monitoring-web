import { defineMessages } from '../../../../../shared/i18n'

export const missionKpisMessages = defineMessages({
  vi: {
    kpi: {
      crew: 'Đội bay',
      media: 'Media',
      checklist: 'Checklist hoàn tất',
      actualDuration: 'Thời lượng thực tế',
      duration: 'Thời lượng',
    },
    plannedSuffix: (value: string) => `${value} dự kiến`,
    notRecorded: 'Chưa ghi nhận',
    crewAccepted: 'đã nhận nhiệm vụ',
  },
  en: {
    kpi: {
      crew: 'Crew',
      media: 'Media',
      checklist: 'Checklist done',
      actualDuration: 'Actual duration',
      duration: 'Duration',
    },
    plannedSuffix: (value: string) => `${value} planned`,
    notRecorded: 'Not recorded',
    crewAccepted: 'accepted',
  },
})
