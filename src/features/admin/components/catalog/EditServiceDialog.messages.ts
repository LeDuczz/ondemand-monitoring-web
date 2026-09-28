import { defineMessages } from '../../../../shared/i18n'

export const editServiceDialogMessages = defineMessages({
  vi: {
    title: (code: string) => `Sửa dịch vụ: ${code}`,
    name: 'Tên dịch vụ',
    minAlt: 'Độ cao min (m)',
    maxAlt: 'Độ cao max (m)',
    sensors: 'Cảm biến:',
    mandatory: 'Bắt buộc',
    cancel: 'Hủy',
    saving: 'Đang lưu...',
    save: 'Lưu',
    genericError: 'Lỗi khi lưu dịch vụ.',
  },
  en: {
    title: (code: string) => `Edit service: ${code}`,
    name: 'Service name',
    minAlt: 'Min altitude (m)',
    maxAlt: 'Max altitude (m)',
    sensors: 'Sensors:',
    mandatory: 'Mandatory',
    cancel: 'Cancel',
    saving: 'Saving...',
    save: 'Save',
    genericError: 'Failed to save the service.',
  },
})
