import { defineMessages } from '../../../../../shared/i18n'

export const docsTableMessages = defineMessages({
  vi: {
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
