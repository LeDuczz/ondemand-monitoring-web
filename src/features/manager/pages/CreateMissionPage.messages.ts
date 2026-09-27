import { defineMessages } from '../../../shared/i18n'

export const createMissionPageMessages = defineMessages({
  vi: {
    loading: 'Đang tải…',
    loadError: 'Không tải được đơn để tạo mission',
    backToQueue: 'Về hàng đợi',
    planFailedTitle: 'Không sinh được flight plan',
    planFailedBody:
      'Dịch vụ tạo đường bay báo lỗi cho khu vực này. Bạn có thể nhập waypoint thủ công.',
    retry: 'Thử lại',
    manualWaypointEntry: 'Nhập waypoint thủ công',
    validationRequired: 'Thời gian bắt đầu/kết thúc là bắt buộc.',
    planGenerationFailed:
      'Dịch vụ tạo đường bay báo lỗi cho khu vực này. Bạn có thể nhập waypoint thủ công.',
    createFailed: 'Tạo mission thất bại, thử lại.',
    title: 'Tạo mission',
    fromOrder: (code: string, service: string, customer: string) =>
      `Từ đơn ${code} · ${service} · ${customer}`,
    flightSchedule: 'Lịch bay',
    start: 'Bắt đầu',
    end: 'Kết thúc',
    flightPlan: 'Flight plan',
    planTypeLabel: 'Kiểu bay',
    radius: 'Bán kính (m)',
    altitude: 'Độ cao (m)',
    speed: 'Tốc độ (m/s)',
    estimatedDuration: (mins: number, tPath: number, tCapture: number) =>
      `Ước tính thời lượng: ${mins} phút (T_path ${tPath}s · T_capture ${tCapture}s)`,
    pathPreviewAria: 'Xem trước đường bay',
    waypoint: (count: number) => `Waypoint (${count})`,
    addWaypoint: 'Thêm waypoint',
    removeWaypointAria: (seq: number) => `Xoá waypoint ${seq}`,
    createMission: 'Tạo mission',
  },
  en: {
    loading: 'Loading…',
    loadError: 'Could not load the order to create a mission',
    backToQueue: 'Back to queue',
    planFailedTitle: 'Could not generate a flight plan',
    planFailedBody:
      'The flight-path service returned an error for this area. You can enter waypoints manually.',
    retry: 'Retry',
    manualWaypointEntry: 'Enter waypoints manually',
    validationRequired: 'Start/end time is required.',
    planGenerationFailed:
      'The flight-path service returned an error for this area. You can enter waypoints manually.',
    createFailed: 'Could not create the mission, try again.',
    title: 'Create mission',
    fromOrder: (code: string, service: string, customer: string) =>
      `From order ${code} · ${service} · ${customer}`,
    flightSchedule: 'Flight schedule',
    start: 'Start',
    end: 'End',
    flightPlan: 'Flight plan',
    planTypeLabel: 'Flight pattern',
    radius: 'Radius (m)',
    altitude: 'Altitude (m)',
    speed: 'Speed (m/s)',
    estimatedDuration: (mins: number, tPath: number, tCapture: number) =>
      `Estimated duration: ${mins} min (T_path ${tPath}s · T_capture ${tCapture}s)`,
    pathPreviewAria: 'Flight path preview',
    waypoint: (count: number) => `Waypoints (${count})`,
    addWaypoint: 'Add waypoint',
    removeWaypointAria: (seq: number) => `Remove waypoint ${seq}`,
    createMission: 'Create mission',
  },
})
