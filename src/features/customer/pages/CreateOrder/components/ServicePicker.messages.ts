import { defineMessages } from '../../../../../shared/i18n'

export const servicePickerMessages = defineMessages({
  vi: {
    cardTitle: 'Đề xuất từ AI hoặc tự chọn dịch vụ',
    aiSuggested: 'AI đề xuất',
    aiSuggestedHint: 'Dựa trên nội dung chat và thông tin yêu cầu hiện tại.',
    defaultDescription: 'Dịch vụ giám sát bằng drone.',
    selectedNow: 'Đang chọn dịch vụ này',
    pickSuggestion: 'Chọn gợi ý này',
    allServices: 'Tất cả dịch vụ đang hoạt động',
    serviceCount: (n: number) => `${n} dịch vụ`,
    loading: 'Đang tải dịch vụ...',
    emptyTitle: 'Chưa có dịch vụ nào đang hoạt động',
    emptyDescription: 'Backend chưa có dịch vụ hoạt động để chọn.',
  },
  en: {
    cardTitle: 'AI suggestions or pick a service yourself',
    aiSuggested: 'AI suggestion',
    aiSuggestedHint: 'Based on the chat content and the current request.',
    defaultDescription: 'Drone monitoring service.',
    selectedNow: 'Currently selected',
    pickSuggestion: 'Choose this suggestion',
    allServices: 'All active services',
    serviceCount: (n: number) => `${n} service(s)`,
    loading: 'Loading services...',
    emptyTitle: 'No active services yet',
    emptyDescription: 'The backend has no active service to choose from.',
  },
})
