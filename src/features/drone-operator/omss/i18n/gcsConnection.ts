import { defineMessages } from '../../../../shared/i18n'

export const gcsConnectionMessages = defineMessages({
  vi: {
    missionDetail: 'Chi tiết nhiệm vụ',
    title: 'Kết nối GCS',
    connectingTo: 'Đang kết nối tới',
    forMission: 'cho nhiệm vụ',
    steps: {
      discover: { label: 'Tìm drone', detail: 'Đang quét endpoint MAVLink' },
      handshake: {
        label: 'Thiết lập liên kết',
        detail: 'Đang đàm phán giao thức heartbeat',
      },
      sync: { label: 'Đồng bộ thông số', detail: 'Đang tải thông số bay' },
      done: { label: 'Kết nối sẵn sàng', detail: 'Đã thiết lập liên kết GCS' },
    },
    log: {
      initiating: 'Đang khởi tạo kết nối GCS…',
      controllerOnline: (droneId: string) =>
        `Flight Controller đã online cho drone ${droneId}`,
      staleSession: 'Phiên điều khiển cũ chưa được xoá, đang reset controller…',
      sessionBound: (missionId: string) =>
        `Phiên điều khiển đã gắn với nhiệm vụ ${missionId}`,
      statusVerified: 'Đã nhận trạng thái MAVSDK/PX4 và xác thực phiên',
      linkReady: 'Liên kết GCS sẵn sàng ✓',
    },
    errors: {
      offline: 'Flight Controller đang offline',
      mavsdkNotConnected: 'MAVSDK hoặc PX4 chưa kết nối',
      sessionVerificationFailed: 'Xác thực phiên Flight Controller thất bại',
      mavsdkDisconnected: 'MAVSDK hoặc PX4 mất kết nối trong khi gắn phiên',
      genericFailed: 'Kết nối GCS thất bại',
    },
    connectToDrone: 'Kết nối tới drone',
    connecting: 'Đang kết nối…',
    returnToMissionControl: 'Quay lại điều khiển nhiệm vụ',
    continueToPreflight: 'Tiếp tục kiểm tra trước bay',
    retryConnection: 'Thử lại kết nối',
  },
  en: {
    missionDetail: 'Mission detail',
    title: 'GCS connection',
    connectingTo: 'Connecting to',
    forMission: 'for mission',
    steps: {
      discover: {
        label: 'Discover drone',
        detail: 'Scanning MAVLink endpoints',
      },
      handshake: {
        label: 'Establish link',
        detail: 'Negotiating heartbeat protocol',
      },
      sync: {
        label: 'Sync parameters',
        detail: 'Downloading flight parameters',
      },
      done: { label: 'Connection ready', detail: 'GCS link established' },
    },
    log: {
      initiating: 'Initiating GCS connection…',
      controllerOnline: (droneId: string) =>
        `Flight Controller online for drone ${droneId}`,
      staleSession: 'Stale control session found, resetting controller…',
      sessionBound: (missionId: string) =>
        `Control session bound to mission ${missionId}`,
      statusVerified: 'MAVSDK/PX4 status received and session verified',
      linkReady: 'GCS link ready ✓',
    },
    errors: {
      offline: 'Flight Controller is offline',
      mavsdkNotConnected: 'MAVSDK or PX4 is not connected',
      sessionVerificationFailed:
        'Flight Controller session verification failed',
      mavsdkDisconnected: 'MAVSDK or PX4 disconnected during session binding',
      genericFailed: 'GCS connection failed',
    },
    connectToDrone: 'Connect to drone',
    connecting: 'Connecting…',
    returnToMissionControl: 'Return to mission control',
    continueToPreflight: 'Continue to pre-flight check',
    retryConnection: 'Retry connection',
  },
})
