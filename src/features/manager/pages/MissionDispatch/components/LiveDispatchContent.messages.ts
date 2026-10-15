import { defineMessages } from '../../../../../shared/i18n'

export const liveDispatchContentMessages = defineMessages({
  vi: {
    staffAvailabilityChanged:
      'Nhân sự không còn khả dụng trong khung giờ Mission này. Danh sách đã được cập nhật; các lựa chọn còn hợp lệ được giữ nguyên.',
    deviceAvailabilityChanged:
      'Thiết bị không còn khả dụng trong khung giờ Mission này. Danh sách đã được cập nhật; các lựa chọn còn hợp lệ được giữ nguyên.',
    resourceAvailabilityChanged:
      'Nguồn lực đã không còn khả dụng trong khung giờ này. Danh sách đã được cập nhật. Vui lòng chọn lại.',
    selectDroneAndOperator:
      'Cần phân công đủ 4 vai trò và ít nhất 1 thiết bị trước khi phân công.',
    loadError: 'Không tải được dữ liệu phân công',
    scheduleRequired:
      'Cần có lịch bắt đầu và kết thúc Mission hợp lệ để kiểm tra nguồn lực.',
    khongTheTaiNguonLuc:
      'Không thể tải nguồn lực của nhiệm vụ này. Vui lòng thử lại.',
  },
  en: {
    staffAvailabilityChanged:
      'Staff are no longer available during this Mission interval. Options have been refreshed; valid selections are retained.',
    deviceAvailabilityChanged:
      'Devices are no longer available during this Mission interval. Options have been refreshed; valid selections are retained.',
    resourceAvailabilityChanged:
      'Resources are no longer available during this interval. Options have been refreshed. Please select again.',
    selectDroneAndOperator:
      'Assign all 4 mission roles and one device before assigning.',
    loadError: 'Could not load the assignment data',
    scheduleRequired:
      'Set a valid Mission start and end time to check resource availability.',
    khongTheTaiNguonLuc:
      "Could not load this mission's resources. Please try again.",
  },
})
