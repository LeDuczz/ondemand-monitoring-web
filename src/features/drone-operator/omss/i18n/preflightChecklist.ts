import { defineMessages } from '../../../../shared/i18n'

export const preflightChecklistMessages = defineMessages({
  vi: {
    back: 'Quay lại',
    title: 'Kiểm tra trước bay',
    description: 'Kiểm tra an toàn tự động trước khi cấp phép bay.',
    checksPassed: 'mục đạt',
    statusLabel: {
      PASS: 'Đạt',
      FAIL: 'Không đạt',
      WARNING: 'Cảnh báo',
      PENDING: 'Chờ xử lý',
    },
    allPassed: (count: number) =>
      `Tất cả ${count} mục đều đạt — sẵn sàng tiếp tục.`,
    someFailed: (failed: number, warned: number) =>
      `${failed} mục không đạt${warned > 0 ? `, ${warned} cảnh báo` : ''} — xem lại kết quả bên dưới.`,
    runChecks: 'Chạy kiểm tra trước bay',
    runningChecks: 'Đang chạy kiểm tra…',
    continueToHandover: 'Tiếp tục bàn giao điều khiển',
    viewFailureReport: 'Xem báo cáo lỗi',
  },
  en: {
    back: 'Back',
    title: 'Pre-flight check',
    description: 'Automated safety checks before flight authorisation.',
    checksPassed: 'checks passed',
    statusLabel: {
      PASS: 'Passed',
      FAIL: 'Failed',
      WARNING: 'Warning',
      PENDING: 'Pending',
    },
    allPassed: (count: number) =>
      `All ${count} checks passed — ready to proceed.`,
    someFailed: (failed: number, warned: number) =>
      `${failed} check${failed > 1 ? 's' : ''} failed${warned > 0 ? `, ${warned} warning${warned > 1 ? 's' : ''}` : ''} — review the results below.`,
    runChecks: 'Run pre-flight checks',
    runningChecks: 'Running checks…',
    continueToHandover: 'Continue to control handover',
    viewFailureReport: 'View failure report',
  },
})
