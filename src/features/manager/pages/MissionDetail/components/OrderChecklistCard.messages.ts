import { defineMessages } from '../../../../../shared/i18n'

export const orderChecklistCardMessages = defineMessages({
  vi: {
    monitoringRequirements: 'Nội dung giám sát',
    requirementsHistory:
      'Nội dung đã chốt khi khách hàng gửi yêu cầu · Chỉ xem, không thay đổi theo danh mục dịch vụ hiện tại.',
    customerRequirement: 'Nội dung khách hàng bổ sung',
    serviceRequirement: 'Nội dung từ dịch vụ',
    requirementsEmpty: 'Khách hàng đã gửi yêu cầu không kèm nội dung giám sát.',
    requirementsLegacy: 'Đơn hàng này chưa có bản chốt nội dung giám sát.',
  },
  en: {
    monitoringRequirements: 'Monitoring requirements',
    requirementsHistory:
      'Requirements saved on customer submission · Read only, independent of the current service catalog.',
    customerRequirement: 'Customer-added requirement',
    serviceRequirement: 'Service requirement',
    requirementsEmpty:
      'The customer submitted this order without monitoring requirements.',
    requirementsLegacy:
      'No monitoring requirements snapshot is available for this order.',
  },
})
