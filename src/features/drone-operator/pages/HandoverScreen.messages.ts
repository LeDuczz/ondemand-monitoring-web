import { defineMessages } from '../../../shared/i18n'

export const handoverScreenMessages = defineMessages({
  vi: {
    commitments: [
      'Tôi đã kiểm tra khu vực bay, không có người và phương tiện trong vùng an toàn, và tuân thủ mọi vùng cấm bay được cảnh báo trong mission.',
      'Tôi giữ drone trong tầm nhìn khi có thể, không bay quá độ cao 120 m và không vượt bán kính vùng giám sát 500 m.',
      'Tôi sẵn sàng bấm RTL hoặc LAND ngay khi có cảnh báo pin thấp, mất telemetry hoặc thời tiết xấu.',
      'Tôi chịu trách nhiệm an toàn vận hành từ lúc xác nhận cho tới khi drone hạ cánh và tắt động cơ.',
    ],
    noMissionSelected: 'Chưa chọn mission',
    noDroneAssigned: 'Chưa gán drone',
    noDroneAssignedError: 'Chọn mission đã gán drone trước khi tiếp tục',
    precheckRequiredError:
      'Vui lòng chạy precheck thành công trước khi bàn giao',
    confirmFailed: 'Không xác nhận được cam kết',
    stepTitle: 'Bàn giao quyền điều khiển',
    commitmentTitle: 'Cam kết an toàn trước khi nhận quyền điều khiển',
    ackLabel: 'Tôi xác nhận đã kiểm soát drone và chịu trách nhiệm vận hành',
    back: 'Quay lại',
    processing: 'Đang xử lý...',
    confirmHandover: 'Xác nhận bàn giao',
    confirmLockedNote:
      'Nút xác nhận bị khoá đến khi bạn tick đủ 4 cam kết. Ghi control_handover.status = CONFIRMED và confirmed_at.',
    connectedAt:
      'Đã kết nối GCS DJI-RC-PLUS-7A31 lúc 13:26:41 · telemetry hoạt động',
    connected: 'Đã kết nối',
  },
  en: {
    commitments: [
      'I have checked the flight area: no people or vehicles in the safety zone, and I comply with every no-fly zone flagged in the mission.',
      'I will keep the drone in visual line of sight where possible, stay under 120 m altitude, and stay within the 500 m monitoring radius.',
      'I am ready to trigger RTL or LAND immediately on a low-battery warning, telemetry loss, or bad weather.',
      'I take responsibility for operational safety from confirmation until the drone lands and the motors are off.',
    ],
    noMissionSelected: 'No mission selected',
    noDroneAssigned: 'No drone assigned',
    noDroneAssignedError:
      'Select a mission with an assigned drone before continuing',
    precheckRequiredError:
      'Please run the precheck successfully before the handover',
    confirmFailed: 'Could not confirm the commitments',
    stepTitle: 'Control handover',
    commitmentTitle: 'Safety commitments before taking control',
    ackLabel:
      'I confirm I am in control of the drone and responsible for operations',
    back: 'Back',
    processing: 'Processing...',
    confirmHandover: 'Confirm handover',
    confirmLockedNote:
      'The confirm button stays locked until all 4 commitments are checked. Writes control_handover.status = CONFIRMED and confirmed_at.',
    connectedAt:
      'Connected to GCS DJI-RC-PLUS-7A31 at 13:26:41 · telemetry active',
    connected: 'Connected',
  },
})
