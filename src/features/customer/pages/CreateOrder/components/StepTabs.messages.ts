import { defineMessages } from '../../../../../shared/i18n'

export const stepTabsMessages = defineMessages({
  vi: {
    ariaLabel: 'Các bước tạo yêu cầu',
    progress: (step: number, total: number) => `Bước ${step} / ${total}`,
    subtitles: {
      1: 'Chọn loại giám sát phù hợp',
      2: 'Chọn và chỉnh nội dung cần kiểm tra',
      3: 'Xác định khu vực cần kiểm tra',
      4: 'Chọn thời điểm thực hiện',
      5: 'Kiểm tra lại và gửi yêu cầu',
    } as Record<1 | 2 | 3 | 4 | 5, string>,
  },
  en: {
    ariaLabel: 'Request creation steps',
    progress: (step: number, total: number) => `Step ${step} of ${total}`,
    subtitles: {
      1: 'Pick the right monitoring type',
      2: 'Choose and edit what to inspect',
      3: 'Define the area to inspect',
      4: 'Choose when it happens',
      5: 'Review and submit the request',
    } as Record<1 | 2 | 3 | 4 | 5, string>,
  },
})
