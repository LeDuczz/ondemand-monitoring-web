import { defineMessages } from '../../../../../shared/i18n'

export const missionResultsMessages = defineMessages({
  vi: {
    title: 'Kết quả của lần bay',
    refresh: 'Cập nhật kết quả',
    progressLoading: 'Đang kiểm tra trạng thái kết quả…',
    progressError: 'Không tải được trạng thái kết quả.',
    loading: 'Đang tải tệp…',
    error: 'Không tải được danh sách tệp.',
    retry: 'Thử lại',
    emptyTitle: 'Chưa có tệp nào',
    emptyDescription: 'Lần bay này chưa có ảnh hoặc video được xác thực.',
    unit: 'tệp',
  },
  en: {
    title: 'Mission results',
    refresh: 'Update results',
    progressLoading: 'Checking the result status…',
    progressError: 'Unable to load the result status.',
    loading: 'Loading files…',
    error: 'Unable to load the file list.',
    retry: 'Retry',
    emptyTitle: 'No files yet',
    emptyDescription: 'This mission has no validated photos or videos yet.',
    unit: 'files',
  },
})
