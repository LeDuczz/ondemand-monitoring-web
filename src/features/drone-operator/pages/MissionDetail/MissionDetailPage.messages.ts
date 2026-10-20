import { defineMessages } from '../../../../shared/i18n'

export const missionDetailPageMessages = defineMessages({
  vi: {
    errorTitle: 'Không tải được mission',
    errorDescription: 'Mission có thể không tồn tại hoặc đã bị xoá.',
    backToList: 'Về danh sách',
    acceptFailed: 'Không thể chấp nhận mission. Vui lòng thử lại.',
    rejectFailed: 'Không thể từ chối mission. Vui lòng thử lại.',
    startFailed:
      'Không thể bắt đầu Mission. Hãy kiểm tra đủ 4 role đã chấp nhận.',
  },
  en: {
    errorTitle: 'Could not load the mission',
    errorDescription: 'The mission may not exist or has been deleted.',
    backToList: 'Back to list',
    acceptFailed: 'Could not accept the mission. Please try again.',
    rejectFailed: 'Could not reject the mission. Please try again.',
    startFailed:
      'Could not start the Mission. Check that all 4 roles have accepted.',
  },
})
