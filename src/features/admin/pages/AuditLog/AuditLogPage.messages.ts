import { defineMessages } from '../../../../shared/i18n'

export const auditLogPageMessages = defineMessages({
  vi: {
    title: 'Nhật ký hệ thống',
    subtitle: 'audit_log — chỉ đọc',
    exportCsv: 'Xuất CSV',
    exportSuccess:
      'Đã xuất CSV thành công. (Placeholder — sẽ kết nối API xuất file)',
    emptyTitle: 'Không có bản ghi nào',
    emptyDescription: 'Thử đổi hoặc xoá bộ lọc.',
  },
  en: {
    title: 'Audit log',
    subtitle: 'audit_log — read-only',
    exportCsv: 'Export CSV',
    exportSuccess:
      'CSV exported successfully. (Placeholder — will connect to export API)',
    emptyTitle: 'No records found',
    emptyDescription: 'Try changing or clearing the filters.',
  },
})
