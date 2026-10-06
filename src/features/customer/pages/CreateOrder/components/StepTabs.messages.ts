import { defineMessages } from '../../../../../shared/i18n'

export const stepTabsMessages = defineMessages({
  vi: {
    ariaLabel: 'Các bước tạo yêu cầu',
    subtitles: {
      1: 'Chọn loại giám sát phù hợp',
      2: 'Xác định khu vực cần kiểm tra',
      3: 'Chọn thời điểm thực hiện',
      4: 'Kiểm tra lại và gửi yêu cầu',
    } as Record<1 | 2 | 3 | 4, string>,
  },
  en: {
    ariaLabel: 'Request creation steps',
    subtitles: {
      1: 'Pick the right monitoring type',
      2: 'Define the area to inspect',
      3: 'Choose when it happens',
      4: 'Review and submit the request',
    } as Record<1 | 2 | 3 | 4, string>,
  },
})
