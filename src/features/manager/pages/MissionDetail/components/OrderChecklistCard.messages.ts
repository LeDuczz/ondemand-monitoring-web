import { defineMessages } from '../../../../../shared/i18n'

export const orderChecklistCardMessages = defineMessages({
  vi: {
    monitoringRequirements: 'Nội dung giám sát',
    requirementsHistory:
      'Nội dung đã chốt khi khách hàng gửi yêu cầu · Chỉ xem, không thay đổi theo danh mục dịch vụ hiện tại.',
    customerRequirement: 'Nội dung khách hàng bổ sung',
    serviceRequirement: 'Nội dung từ dịch vụ',
    evidenceRequirement: (count: number, type: string) =>
      `Bằng chứng: tối thiểu ${count} · ${type}`,
    image: 'Ảnh',
    video: 'Video',
    imageOrVideo: 'Ảnh hoặc video (cũ)',
    imageAndVideoRequirement: (images: number, videos: number) =>
      `Bằng chứng: tối thiểu ${images} ảnh + ${videos} video`,
    requirementsEmpty: 'Khách hàng đã gửi yêu cầu không kèm nội dung giám sát.',
    requirementsLegacy: 'Đơn hàng này chưa có bản chốt nội dung giám sát.',
  },
  en: {
    monitoringRequirements: 'Monitoring requirements',
    requirementsHistory:
      'Requirements saved on customer submission · Read only, independent of the current service catalog.',
    customerRequirement: 'Customer-added requirement',
    serviceRequirement: 'Service requirement',
    evidenceRequirement: (count: number, type: string) =>
      `Evidence: at least ${count} · ${type}`,
    image: 'Image',
    video: 'Video',
    imageOrVideo: 'Image or video (legacy)',
    imageAndVideoRequirement: (images: number, videos: number) =>
      `Evidence: at least ${images} images + ${videos} videos`,
    requirementsEmpty:
      'The customer submitted this order without monitoring requirements.',
    requirementsLegacy:
      'No monitoring requirements snapshot is available for this order.',
  },
})
