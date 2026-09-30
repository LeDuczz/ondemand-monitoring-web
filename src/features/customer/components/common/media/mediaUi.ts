import { defineMessages } from '../../../../../shared/i18n'

/** Labels reused by several media components (kind names, empty values). */
export const mediaUiMessages = defineMessages({
  vi: {
    kind: { image: 'Ảnh', video: 'Video', other: 'Tệp' },
    unknown: '—',
  },
  en: {
    kind: { image: 'Photo', video: 'Video', other: 'File' },
    unknown: '—',
  },
})
