import { defineMessages } from '../../../../../shared/i18n'

export const uploadProgressSummaryMessages = defineMessages({
  vi: {
    mediaLoaded: 'media đã tải',
    uploadedChip: (n: number) => `${n} đã upload`,
    pendingChip: (n: number) => `${n} chờ xử lý`,
    uploadingChip: (n: number) => `${n} đang tải`,
    manualChip: (n: number) => `${n} cần thủ công`,
    summary: (
      uploaded: number,
      total: number,
      uploading: number,
      manual: number,
    ) =>
      `${uploaded}/${total} file đã lên${uploading ? ` · ${uploading} đang lên` : ''}${manual ? ` · ${manual} cần xử lý thủ công` : ''}`,
    summaryNote: 'File local được giữ đến khi duyệt hoặc xóa.',
  },
  en: {
    mediaLoaded: 'media uploaded',
    uploadedChip: (n: number) => `${n} uploaded`,
    pendingChip: (n: number) => `${n} pending`,
    uploadingChip: (n: number) => `${n} uploading`,
    manualChip: (n: number) => `${n} need manual upload`,
    summary: (
      uploaded: number,
      total: number,
      uploading: number,
      manual: number,
    ) =>
      `${uploaded}/${total} files uploaded${uploading ? ` · ${uploading} uploading` : ''}${manual ? ` · ${manual} need manual review` : ''}`,
    summaryNote: 'Local files are kept until approved or deleted.',
  },
})
