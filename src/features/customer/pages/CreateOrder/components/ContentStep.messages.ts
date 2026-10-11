import { defineMessages } from '../../../../../shared/i18n'

export const contentStepMessages = defineMessages({
  vi: {
    summaryTitle: 'Tóm tắt yêu cầu',
    service: 'Dịch vụ đã chọn',
    notSelected: 'Chưa chọn',
    selectedCount: 'Nội dung đã chọn',
    count: (n: number) => `${n} / 100`,
    hint: 'Nội dung giám sát được chốt khi bạn gửi yêu cầu. Bạn có thể quay lại bước trước để đổi dịch vụ.',
    invalid: 'Hãy sửa các nội dung chưa hợp lệ để tiếp tục.',
  },
  en: {
    summaryTitle: 'Request summary',
    service: 'Selected service',
    notSelected: 'Not selected',
    selectedCount: 'Selected content',
    count: (n: number) => `${n} / 100`,
    hint: 'Monitoring content is locked when you submit the request. Go back to change the service.',
    invalid: 'Fix the invalid items to continue.',
  },
})
