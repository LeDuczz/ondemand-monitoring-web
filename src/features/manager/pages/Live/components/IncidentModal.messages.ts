import { defineMessages } from '../../../../../shared/i18n'

export const incidentModalMessages = defineMessages({
  vi: {
    incidentModal: {
      chooseType: 'Chọn loại sự cố.',
      descriptionRequired: 'Mô tả là bắt buộc.',
      ariaLabel: 'Ghi nhận sự cố',
      title: 'Ghi nhận sự cố',
      typeLabel: 'Loại sự cố',
      typePlaceholder: '-- Chọn loại --',
      descriptionLabel: 'Mô tả chi tiết',
      descriptionPlaceholder: 'Mô tả sự cố…',
      cancel: 'Huỷ',
      saving: 'Đang ghi…',
      submit: 'Ghi nhận',
    },
    incidentTypes: {
      WIND: 'Gió mạnh / thời tiết',
      OBSTACLE: 'Chướng ngại vật',
      SIGNAL_LOSS: 'Mất tín hiệu',
      BATTERY_LOW: 'Pin yếu bất thường',
      MECHANICAL: 'Sự cố cơ học',
      OTHER: 'Khác',
    },
  },
  en: {
    incidentModal: {
      chooseType: 'Choose an incident type.',
      descriptionRequired: 'Description is required.',
      ariaLabel: 'Report incident',
      title: 'Report incident',
      typeLabel: 'Incident type',
      typePlaceholder: '-- Choose a type --',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Describe the incident…',
      cancel: 'Cancel',
      saving: 'Saving…',
      submit: 'Report',
    },
    incidentTypes: {
      WIND: 'Strong wind / weather',
      OBSTACLE: 'Obstacle',
      SIGNAL_LOSS: 'Signal loss',
      BATTERY_LOW: 'Abnormally low battery',
      MECHANICAL: 'Mechanical issue',
      OTHER: 'Other',
    },
  },
})
