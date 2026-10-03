import { defineMessages } from '../../../../../shared/i18n'

export const servicePickerMessages = defineMessages({
  vi: {
    cardTitle: 'Chọn dịch vụ giám sát',
    cardHint: 'Đây là lựa chọn chính của yêu cầu. Chọn dịch vụ phù hợp trước, AI chỉ hỗ trợ khi bạn chưa chắc nên chọn gì.',
    aiSuggested: 'AI đề xuất',
    aiSuggestedHint: 'Dựa trên nội dung chat và thông tin yêu cầu hiện tại.',
    defaultDescription: 'Dịch vụ giám sát bằng drone.',
    selectedNow: 'Đang chọn dịch vụ này',
    selectedBadge: 'Đã chọn',
    pickSuggestion: 'Chọn gợi ý này',
    allServices: 'Dịch vụ đang hoạt động',
    serviceCount: (n: number) => `${n} dịch vụ`,
    loading: 'Đang tải dịch vụ...',
    emptyTitle: 'Chưa có dịch vụ nào đang hoạt động',
    emptyDescription: 'Backend chưa có dịch vụ hoạt động để chọn.',
  },
  en: {
    cardTitle: 'Choose a monitoring service',
    cardHint: 'This is the main choice for the request. Pick the service first; AI is only here if you are unsure.',
    aiSuggested: 'AI suggestion',
    aiSuggestedHint: 'Based on the chat content and the current request.',
    defaultDescription: 'Drone monitoring service.',
    selectedNow: 'Currently selected',
    selectedBadge: 'Selected',
    pickSuggestion: 'Choose this suggestion',
    allServices: 'Active services',
    serviceCount: (n: number) => `${n} service(s)`,
    loading: 'Loading services...',
    emptyTitle: 'No active services yet',
    emptyDescription: 'The backend has no active service to choose from.',
  },
})
