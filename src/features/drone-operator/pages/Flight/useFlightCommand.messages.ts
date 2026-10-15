import { defineMessages } from '../../../../shared/i18n'

export const flightCommandMessages = defineMessages({
  vi: {
    preflightRequired: 'Cần hoàn thành kiểm tra trước bay',
    noWaypoints: 'Không có waypoint trong kế hoạch mission',
    autoPlanStarted: (count: number) =>
      `Đã bắt đầu kế hoạch tự động (${count} điểm)`,
    cameraReset: 'Camera đã đặt lại về 0° FPV',
    commandSent: (command: string) => `Đã gửi lệnh ${command}`,
    controllerOffline: 'Bộ điều khiển ngoại tuyến hoặc lệnh bị từ chối',
    noPermission: 'Chưa có quyền vận hành Mission. Làm mới trạng thái.',
    stoppedOrNoPermission:
      'Mission đang dừng hoặc chưa có quyền thực hiện lệnh này.',
    cannotConfirmPermission: 'Không thể xác nhận quyền Mission. Chưa gửi lệnh.',
    noGpsTarget: 'Mission chưa có tọa độ GPS mục tiêu',
    outsideServiceArea: 'Mục tiêu nằm ngoài vùng phục vụ TP.HCM',
    waitingGps: 'Chưa có GPS hiện tại để tạo đường bay né vùng cấm',
    binding: 'Đang kết nối bộ điều khiển drone...',
    photoSaved: 'Đã chụp ảnh — bấm Xem lại để duyệt và upload',
    gpsTargetStarted: 'Đã bắt đầu bay tới mục tiêu GPS',
    legacyWaypointsUnavailable:
      'Đường bay mô phỏng cũ không dùng được trong chế độ bản đồ GPS',
  },
  en: {
    preflightRequired: 'Preflight required',
    noWaypoints: 'No mission plan waypoints',
    autoPlanStarted: (count: number) => `Auto plan started (${count} points)`,
    cameraReset: 'Camera reset to 0° FPV',
    commandSent: (command: string) => `${command} sent`,
    controllerOffline: 'Controller offline or command rejected',
    noPermission:
      'You do not have permission to operate the mission. Refresh the status.',
    stoppedOrNoPermission:
      'The mission is stopping or you do not have permission for this command.',
    cannotConfirmPermission:
      'Cannot confirm mission permissions. Command not sent.',
    noGpsTarget: 'Mission has no GPS target',
    outsideServiceArea: 'Target is outside Ho Chi Minh City service area',
    waitingGps: 'Waiting for current GPS before starting route flight',
    binding: 'Binding drone controller...',
    photoSaved: 'Photo saved — open Review to approve it',
    gpsTargetStarted: 'GPS target flight started',
    legacyWaypointsUnavailable:
      'Legacy simulation waypoints are unavailable in GPS map mode',
  },
})
