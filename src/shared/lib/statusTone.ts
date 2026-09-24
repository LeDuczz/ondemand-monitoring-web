// Maps every backend/brief status enum to one of the 6 status-colour tones
// from [BRIEF Phần B "Quy ước hiển thị trạng thái"]:
//   gray   = nháp / chưa xử lý       (DRAFT, PENDING, CREATED)
//   yellow = đang chờ người khác     (SUBMITTED, UNDER_REVIEW, ASSIGNED)
//   blue   = đang diễn ra            (IN_PROGRESS, IN_FLIGHT, UPLOADING, LIVE)
//   green  = thành công              (APPROVED, COMPLETED, AVAILABLE, PASS)
//   orange = cảnh báo                (WARNING, RISKY, MANUAL_REQUIRED, MAINTENANCE)
//   red    = lỗi / từ chối           (REJECTED, FAILED, VALIDATION_FAILED, BLOCKER)
//
// Backend enum values not named in the brief table are mapped "by meaning"
// (see inline comments) and called out in evd/P0-mock-api-foundation.md.
import type {
  AiVerdict,
  DroneStatus,
  FindingSeverity,
  MediaStatus,
  MissionStatus,
  OrderStatus,
  StatusTone,
  TicketSeverity,
  TicketStatus,
} from '../types/domain'

export const orderStatusTone: Record<OrderStatus, StatusTone> = {
  DRAFT: 'gray',
  AI_ANALYZED: 'blue',
  SUBMITTED: 'yellow',
  PENDING: 'gray',
  APPROVED: 'green',
  SCHEDULED: 'blue',
  REJECTED: 'red',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'gray',
}

export const missionStatusTone: Record<MissionStatus, StatusTone> = {
  CREATED: 'gray', // brief: CREATED → gray
  // mapping by meaning: system is still matching drone/operator, nothing to
  // act on yet — closer to "waiting" than "in progress".
  RESOURCE_ASSIGNING: 'yellow',
  WAITING_OPERATOR_ACCEPTANCE: 'yellow', // brief: ASSIGNED-like → yellow
  // mapping by meaning: operator accepted, mission is waiting for its
  // scheduled window — still "waiting", not yet active.
  SCHEDULED: 'yellow',
  // mapping by meaning: device link established, an active process.
  CONNECTED: 'blue',
  // mapping by meaning: checklist actively running.
  PREFLIGHT_CHECKING: 'blue',
  // mapping by meaning: all checks passed — a success state, like AVAILABLE/PASS.
  READY_TO_FLY: 'green',
  FAILED_PREFLIGHT: 'red', // brief: FAILED-like → red
  // mapping by meaning: bounced back to the manager queue, waiting on them.
  PENDING_APPROVAL: 'yellow',
  IN_FLIGHT: 'blue', // brief: IN_FLIGHT → blue
  IN_PROGRESS: 'blue', // brief: IN_PROGRESS → blue (legacy alias of IN_FLIGHT)
  // mapping by meaning: drone airborne and moving back to base, active process.
  RETURNING: 'blue',
  // mapping by meaning: checklist actively running.
  POSTFLIGHT_CHECKING: 'blue',
  COMPLETED: 'green', // brief: COMPLETED → green
  FAILED: 'red', // brief: FAILED → red
  // mapping by meaning: terminal, non-error stop, same as OrderStatus.CANCELLED.
  CANCELLED: 'gray',
}

export const droneStatusTone: Record<DroneStatus, StatusTone> = {
  AVAILABLE: 'green', // brief: AVAILABLE → green
  // mapping by meaning: held for an upcoming mission, not yet flying — waiting.
  RESERVED: 'yellow',
  // mapping by meaning: checklist actively running before takeoff.
  PREFLIGHT: 'blue',
  // mapping by meaning: airborne, an active process (same family as IN_FLIGHT).
  IN_MISSION: 'blue',
  ACTIVE_MISSION: 'blue', // diagram alias of IN_MISSION, same tone
  // mapping by meaning: airborne and moving, active process.
  RETURNING: 'blue',
  // mapping by meaning: unavailable but not a problem, waiting to be ready again.
  CHARGING: 'yellow',
  IDLE_CHARGING: 'yellow', // same meaning as CHARGING
  MAINTENANCE: 'orange', // brief: MAINTENANCE → orange
  // mapping by meaning: worse than MAINTENANCE — drone pulled from service.
  OUT_OF_SERVICE: 'red',
  // mapping by meaning: no telemetry, unknown state — neutral/unprocessed.
  OFFLINE: 'gray',
}

export const aiVerdictTone: Record<AiVerdict, StatusTone> = {
  FEASIBLE: 'green', // meaning: success, matches APPROVED/PASS family
  RISKY: 'orange', // brief: RISKY → orange
  // mapping by meaning: engine recommends rejecting, matches REJECTED/FAILED family.
  INFEASIBLE: 'red',
}

export const findingSeverityTone: Record<FindingSeverity, StatusTone> = {
  // mapping by meaning: informational note, lowest severity, neutral.
  INFO: 'gray',
  WARNING: 'orange', // brief: WARNING → orange
  BLOCKER: 'red', // brief: BLOCKER → red
}

export const ticketSeverityTone: Record<TicketSeverity, StatusTone> = {
  // mapping by meaning: 4-step severity scale, spread across the tone ramp
  // the same way FindingSeverity (INFO/WARNING/BLOCKER) does.
  LOW: 'gray',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
}

export const mediaStatusTone: Record<MediaStatus, StatusTone> = {
  PENDING_UPLOAD: 'gray', // brief: PENDING-like → gray
  UPLOADING: 'blue', // brief: UPLOADING → blue
  // mapping by meaning: uploaded, waiting for validation to start.
  UPLOADED: 'yellow',
  // mapping by meaning: validation actively running.
  VALIDATING: 'blue',
  // mapping by meaning: validation succeeded, matches PASS family.
  VALIDATED: 'green',
  VALIDATION_FAILED: 'red', // brief: VALIDATION_FAILED → red
  AVAILABLE: 'green', // brief: AVAILABLE → green
  MANUAL_REQUIRED: 'orange', // brief: MANUAL_REQUIRED → orange
}

export const orderStatusLabel: Record<OrderStatus, string> = {
  DRAFT: 'Nháp',
  AI_ANALYZED: 'Đã phân tích AI',
  SUBMITTED: 'Đã gửi duyệt',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  SCHEDULED: 'Đã lên lịch',
  REJECTED: 'Từ chối',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
}

export const missionStatusLabel: Record<MissionStatus, string> = {
  CREATED: 'Mới tạo',
  RESOURCE_ASSIGNING: 'Đang gán nguồn lực',
  WAITING_OPERATOR_ACCEPTANCE: 'Chờ operator nhận',
  SCHEDULED: 'Đã lên lịch',
  CONNECTED: 'Đã kết nối',
  PREFLIGHT_CHECKING: 'Đang kiểm tra trước bay',
  READY_TO_FLY: 'Sẵn sàng bay',
  FAILED_PREFLIGHT: 'Kiểm tra trước bay thất bại',
  PENDING_APPROVAL: 'Chờ Manager xử lý',
  IN_FLIGHT: 'Đang bay',
  IN_PROGRESS: 'Đang bay',
  RETURNING: 'Đang trở về',
  POSTFLIGHT_CHECKING: 'Đang kiểm tra sau bay',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã huỷ',
}

export const droneStatusLabel: Record<DroneStatus, string> = {
  AVAILABLE: 'Sẵn sàng',
  RESERVED: 'Đã đặt trước',
  PREFLIGHT: 'Đang kiểm tra trước bay',
  IN_MISSION: 'Đang bay',
  ACTIVE_MISSION: 'Đang bay',
  RETURNING: 'Đang trở về',
  CHARGING: 'Đang sạc',
  IDLE_CHARGING: 'Đang sạc',
  MAINTENANCE: 'Bảo trì',
  OUT_OF_SERVICE: 'Ngừng dùng',
  OFFLINE: 'Mất kết nối',
}

export const aiVerdictLabel: Record<AiVerdict, string> = {
  FEASIBLE: 'Khả thi',
  RISKY: 'Rủi ro',
  INFEASIBLE: 'Không khả thi',
}

export const findingSeverityLabel: Record<FindingSeverity, string> = {
  INFO: 'Thông tin',
  WARNING: 'Cảnh báo',
  BLOCKER: 'Chặn',
}

export const ticketSeverityLabel: Record<TicketSeverity, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  CRITICAL: 'Nghiêm trọng',
}

export const ticketStatusTone: Record<TicketStatus, StatusTone> = {
  OPEN: 'yellow',
  IN_PROGRESS: 'blue',
  RESOLVED: 'green',
  CLOSED: 'gray',
}

export const ticketStatusLabel: Record<TicketStatus, string> = {
  OPEN: 'Mở',
  IN_PROGRESS: 'Đang thực hiện',
  RESOLVED: 'Đã xử lý',
  CLOSED: 'Đã đóng',
}

export const mediaStatusLabel: Record<MediaStatus, string> = {
  PENDING_UPLOAD: 'Chờ tải lên',
  UPLOADING: 'Đang tải lên',
  UPLOADED: 'Đã tải lên',
  VALIDATING: 'Đang xác thực',
  VALIDATED: 'Đã xác thực',
  VALIDATION_FAILED: 'Xác thực thất bại',
  AVAILABLE: 'Sẵn sàng',
  MANUAL_REQUIRED: 'Cần xử lý thủ công',
}
