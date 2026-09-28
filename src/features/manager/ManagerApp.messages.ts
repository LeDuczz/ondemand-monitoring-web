import { defineMessages } from '../../shared/i18n'

export const managerAppMessages = defineMessages({
  vi: {
    breadcrumb: {
      dashboard: 'Dashboard',
      orderQueue: 'Duyệt đơn',
      orderReview: 'Duyệt đơn',
      missionCreate: 'Mission',
      missionDispatch: 'Mission',
      schedule: 'Lịch mission',
      live: 'Giám sát realtime',
      missions: 'Mission',
      drones: 'Đội drone',
      maintenance: 'Bảo trì',
      media: 'Media và giao kết quả',
      reports: 'Báo cáo',
      notFound: 'Không tìm thấy',
    },
    notFoundTitle: 'Không tìm thấy màn hình',
    notFoundDescription: 'Đường dẫn này không tồn tại trong khu vực Manager.',
    backToDashboard: 'Về Dashboard',
    redirecting:
      'Mission đã được backend tạo khi duyệt đơn. Đang mở trang phân công…',
  },
  en: {
    breadcrumb: {
      dashboard: 'Dashboard',
      orderQueue: 'Order review',
      orderReview: 'Order review',
      missionCreate: 'Mission',
      missionDispatch: 'Mission',
      schedule: 'Mission schedule',
      live: 'Realtime monitoring',
      missions: 'Missions',
      drones: 'Drone fleet',
      maintenance: 'Maintenance',
      media: 'Media & deliverables',
      reports: 'Reports',
      notFound: 'Not found',
    },
    notFoundTitle: 'Screen not found',
    notFoundDescription: 'This path does not exist in the Manager area.',
    backToDashboard: 'Back to Dashboard',
    redirecting:
      'The mission was already created by the backend when the order was approved. Opening the assignment page…',
  },
})
