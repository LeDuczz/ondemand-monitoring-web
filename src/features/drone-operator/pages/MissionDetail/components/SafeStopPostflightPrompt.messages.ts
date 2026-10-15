import { defineMessages } from '../../../../../shared/i18n'

export const safeStopPostflightPromptMessages = defineMessages({
  vi: {
    description:
      'Mission đã xác nhận an toàn nhưng chưa hoàn tất kiểm tra sau bay. Quyền bay vẫn bị khóa.',
    prepare: 'Chuẩn bị kiểm tra sau bay',
  },
  en: {
    description:
      'The mission is confirmed safe but the postflight check is not complete. Flight authorization remains locked.',
    prepare: 'Prepare postflight check',
  },
})
