import { defineMessages } from '../../../../../shared/i18n'

export const batteryWarningBannerMessages = defineMessages({
  vi: {
    low: 'Pin yếu',
    critical: 'Pin nguy hiểm',
    emergency: 'Pin khẩn cấp',
    note: 'Vẫn có thể điều khiển thủ công. Không có thao tác bay tự động nào được kích hoạt.',
  },
  en: {
    low: 'Low battery',
    critical: 'Critical battery',
    emergency: 'Emergency battery',
    note: 'Manual control remains available. No automatic flight action was triggered.',
  },
})
