import { defineMessages } from '../../../../shared/i18n'

export const notEligibleNoticeMessages = defineMessages({
  vi: {
    nhiemVuChuaDuDieu:
      'Nhiệm vụ chưa đủ điều kiện phân công nguồn lực. Chốt kế hoạch Order và kiểm tra trạng thái nhiệm vụ trước khi tiếp tục.',
    openOrderPlan: 'Mở kế hoạch Order',
    reloadStatus: 'Tải lại trạng thái',
  },
  en: {
    nhiemVuChuaDuDieu:
      'The mission is not eligible for resource assignment. Finalize the Order plan and check the mission status before continuing.',
    openOrderPlan: 'Open Order plan',
    reloadStatus: 'Reload status',
  },
})
