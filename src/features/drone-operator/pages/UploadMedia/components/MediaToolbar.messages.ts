import { defineMessages } from '../../../../../shared/i18n'

export const mediaToolbarMessages = defineMessages({
  vi: {
    mediaList: 'Danh sách media',
    fileCount: (n: number) => `${n} file`,
    filterLabel: 'Lọc trạng thái',
    filterAll: 'Tất cả',
    filterPending: 'Chờ xử lý',
    filterUploaded: 'Đã upload',
    sortLabel: 'Sắp xếp',
    sortNewest: 'Mới nhất',
    sortOldest: 'Cũ nhất',
    gridView: 'Dạng lưới',
    listView: 'Dạng danh sách',
  },
  en: {
    mediaList: 'Media',
    fileCount: (n: number) => `${n} file(s)`,
    filterLabel: 'Filter by status',
    filterAll: 'All',
    filterPending: 'Pending',
    filterUploaded: 'Uploaded',
    sortLabel: 'Sort',
    sortNewest: 'Newest',
    sortOldest: 'Oldest',
    gridView: 'Grid view',
    listView: 'List view',
  },
})
