import { defineMessages } from '../../../../shared/i18n'

export const postflightPageMessages = defineMessages({
  vi: {
    noMissionId: 'Không xác định được ID nhiệm vụ',
    assessAllRequired: (total: number) =>
      `Vui lòng kiểm tra và chọn ĐẠT/KHÔNG ĐẠT đủ cả ${total} mục.`,
    saveFailed:
      'Không thể lưu báo cáo Postflight. Vui lòng kiểm tra kết nối Server.',
    noteWriteFailed: 'Không ghi được ghi chú bảo trì',
    incidentDetailsPrefix: '[Chi tiết sự cố]:',
    missionNotFoundTitle: 'Không tìm thấy thông tin nhiệm vụ',
    missionNotFoundDesc: 'Vui lòng chọn nhiệm vụ cần thực hiện Postcheck.',
    defaultMissionLabel: 'Nhiệm vụ',
    stepTitle: 'Postflight Check — Kiểm tra sau chuyến bay',
    failedItemsDescription: (items: string) =>
      `Mục không đạt kiểm tra sau bay: ${items}`,
  },
  en: {
    noMissionId: 'Could not determine the mission ID',
    assessAllRequired: (total: number) =>
      `Please inspect and mark PASS/FAIL for all ${total} items.`,
    saveFailed:
      'Could not save the postflight report. Please check the server connection.',
    noteWriteFailed: 'Could not save the maintenance note',
    incidentDetailsPrefix: '[Incident details]:',
    missionNotFoundTitle: 'Mission information not found',
    missionNotFoundDesc: 'Please select the mission to run the postcheck for.',
    defaultMissionLabel: 'Mission',
    stepTitle: 'Postflight check — post-flight inspection',
    failedItemsDescription: (items: string) =>
      `Failed post-flight check items: ${items}`,
  },
})
