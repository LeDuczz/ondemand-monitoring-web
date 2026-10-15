import { defineMessages } from '../../../../../shared/i18n'

export const mediaAttachChecklistMessages = defineMessages({
  vi: {
    attachToChecklist: 'Gắn vào checklist',
    attachSelected: (n: number) => `${n} mục`,
    attachEvidence: 'Gắn bằng chứng — không upload lại',
  },
  en: {
    attachToChecklist: 'Attach to checklist',
    attachSelected: (n: number) => `${n} item(s)`,
    attachEvidence: 'Attach evidence — no re-upload',
  },
})
