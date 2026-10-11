import { defineMessages } from '../../../shared/i18n'

export const preflightItemMessages = defineMessages({
  vi: {
    groups: {
      device: 'Thiết bị',
      connection: 'Kết nối',
      system: 'Hệ thống',
    },
    items: {
      battery: { label: 'Pin', detail: 'telemetry hiện tại' },
      camera: { label: 'Camera', detail: 'camera hiện tại' },
      lidar: { label: 'LiDAR', detail: 'cảm biến khoảng cách' },
      modules: { label: 'Module Check', detail: 'system modules' },
      gazebo: { label: 'Gazebo Simulation', detail: 'simulation world' },
      px4: { label: 'Bộ điều khiển bay PX4', detail: 'bộ điều khiển bay' },
      mavsdk: { label: 'Kết nối MAVSDK', detail: 'cầu nối telemetry' },
      px4Control: { label: 'Điều khiển PX4', detail: 'kênh lệnh' },
      localPosition: { label: 'Local Position', detail: 'PX4 local pose' },
      mavsdkHealth: { label: 'Trạng thái MAVSDK', detail: 'điều kiện arm' },
      backend: { label: 'Kết nối backend', detail: 'backend mission' },
      media: { label: 'Tải media', detail: 'luồng upload' },
    },
    pass: 'Đạt',
    fail: 'Không đạt',
    notePlaceholder: 'Ghi chú lỗi (bắt buộc khi không đạt)',
  },
  en: {
    groups: {
      device: 'Device',
      connection: 'Connection',
      system: 'System',
    },
    items: {
      battery: { label: 'Battery', detail: 'current telemetry' },
      camera: { label: 'Camera', detail: 'current camera' },
      lidar: { label: 'LiDAR', detail: 'range sensor' },
      modules: { label: 'Module Check', detail: 'system modules' },
      gazebo: { label: 'Gazebo Simulation', detail: 'simulation world' },
      px4: { label: 'PX4 Flight Controller', detail: 'flight controller' },
      mavsdk: { label: 'MAVSDK Connection', detail: 'telemetry bridge' },
      px4Control: { label: 'PX4 Control', detail: 'command channel' },
      localPosition: { label: 'Local Position', detail: 'PX4 local pose' },
      mavsdkHealth: { label: 'MAVSDK Health', detail: 'armable health' },
      backend: { label: 'Backend Connection', detail: 'mission backend' },
      media: { label: 'Media Upload', detail: 'upload pipeline' },
    },
    pass: 'Pass',
    fail: 'Fail',
    notePlaceholder: 'Failure note (required when not passed)',
  },
})
