import { defineMessages } from '../../../../../shared/i18n'

export const precheckCardMessages = defineMessages({
  vi: {
    title: 'Kết quả precheck',
    statusReady: 'Đã đạt',
    statusFailed: 'Không đạt',
    statusChecking: 'Đang kiểm',
    statusNotChecked: 'Chưa kiểm',
    checkCode: 'Mã check',
    progress: 'Tiến độ',
    progressValue: (pct: number, passCount: number, failCount: number) =>
      `${pct}% · ${passCount} đạt${failCount ? ` · ${failCount} lỗi` : ''}`,
    collapse: 'Thu gọn ↑',
    showMore: (n: number) => `Xem chi tiết (${n} thêm) ↓`,
    noData: 'Chưa có dữ liệu precheck cho mission này.',
  },
  en: {
    title: 'Precheck results',
    statusReady: 'Passed',
    statusFailed: 'Failed',
    statusChecking: 'Checking',
    statusNotChecked: 'Not checked',
    checkCode: 'Check ID',
    progress: 'Progress',
    progressValue: (pct: number, passCount: number, failCount: number) =>
      `${pct}% · ${passCount} passed${failCount ? ` · ${failCount} failed` : ''}`,
    collapse: 'Collapse ↑',
    showMore: (n: number) => `Show details (${n} more) ↓`,
    noData: 'No precheck data for this mission yet.',
  },
})
