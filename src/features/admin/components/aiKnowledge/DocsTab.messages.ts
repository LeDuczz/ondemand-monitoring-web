import { defineMessages } from '../../../../shared/i18n'

export const docsTabMessages = defineMessages({
  vi: {
    uploadHint:
      'Kéo thư mục hoặc nhấp để tải lên tài liệu (PDF, DOCX) — Tính năng sẽ sẵn sàng sau',
    title: 'Tiêu đề',
    type: 'Loại',
    version: 'Phiên bản',
    effectiveFrom: 'Hiệu lực từ',
    status: 'Trạng thái',
    chunkCount: 'Số chunk',
    actions: 'Thao tác',
    reindex: 'Index lại',
    docStatus: {
      INDEXED: 'Đã index',
      PENDING: 'Chờ xử lý',
      FAILED: 'Thất bại',
    },
  },
  en: {
    uploadHint:
      'Drag a folder or click to upload documents (PDF, DOCX) — coming soon',
    title: 'Title',
    type: 'Type',
    version: 'Version',
    effectiveFrom: 'Effective from',
    status: 'Status',
    chunkCount: 'Chunk count',
    actions: 'Actions',
    reindex: 'Reindex',
    docStatus: {
      INDEXED: 'Indexed',
      PENDING: 'Pending',
      FAILED: 'Failed',
    },
  },
})
