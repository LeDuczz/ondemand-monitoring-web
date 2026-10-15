import { ApiError } from '../../../shared/api/httpClient'
import { defineMessages, getLanguage } from '../../../shared/i18n'
import type { SafeStop } from '../../manager/types/planning'

export type SafeStopPhase =
  | 'notRequested'
  | 'requested'
  | 'inProgress'
  | 'confirmed'
  | 'cleaned'
  | 'failed'
  | 'unknown'

// Presentation only: confirmation is a timestamp, not a new backend state.
export function safeStopPhase(
  stop: SafeStop | null | undefined,
): SafeStopPhase {
  if (!stop) return 'unknown'
  if (stop.status === 'FAILED') return 'failed'
  if (stop.cleanedAt || stop.status === 'READY_FOR_CANCELLATION')
    return 'cleaned'
  if (stop.confirmedAt) return 'confirmed'
  if (stop.status === 'IN_PROGRESS') return 'inProgress'
  if (stop.status === 'REQUESTED' || (!stop.status && stop.requestedAt))
    return 'requested'
  return stop.status ? 'unknown' : 'notRequested'
}

export function hasStopRequest(stop: SafeStop | null | undefined): boolean {
  return Boolean(
    stop?.status || stop?.requestedAt || stop?.confirmedAt || stop?.cleanedAt,
  )
}

/** Choose one next action from explicit capabilities, never grant permission by phase. */
export function managerStopAction(
  stop: SafeStop | null | undefined,
): 'request' | 'cleanup' | 'cancel' | null {
  if (!stop) return null
  if (stop.canCancelMission === true) return 'cancel'
  if (stop.canCleanupSafeStop === true && !stop.cleanedAt) return 'cleanup'
  if (stop.canRequestSafeStop === true && !hasStopRequest(stop))
    return 'request'
  return null
}

const safeStopMessages = defineMessages({
  vi: {
    errors: {
      ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này.',
      UNAUTHORIZED: 'Vui lòng đăng nhập lại để tiếp tục.',
      INVALID_REQUEST: 'Kiểm tra thông tin xác nhận và thử lại.',
      EXECUTION_PLAN_REVISION_CONFLICT:
        'Kế hoạch đã thay đổi. Làm mới trạng thái trước khi tiếp tục.',
      EXECUTION_PLAN_NOT_DRAFT:
        'Cần mở điều chỉnh kế hoạch trước khi tiếp tục hủy Mission.',
      MISSION_SAFE_STOP_NOT_READY:
        'Mission chưa ở trạng thái an toàn để tiếp tục. Làm mới trạng thái hoặc liên hệ đội bay.',
      MISSION_SAFE_STOP_FAILED:
        'Chưa hoàn tất dừng an toàn. Liên hệ đội bay và làm mới trạng thái để tiếp tục.',
      MISSION_CANCELLATION_REQUIRES_SAFE_STOP:
        'Cần hoàn tất dừng an toàn trước khi hủy Mission.',
      MISSION_CANCELLATION_NOT_ALLOWED:
        'Mission chưa đủ điều kiện hủy. Làm mới trạng thái để kiểm tra lại.',
      MISSION_RESULT_ALREADY_APPROVED:
        'Kết quả đã được duyệt; không thể hủy Mission này.',
    } as Record<string, string>,
    failureDefault:
      'Chưa hoàn tất dừng an toàn. Liên hệ đội bay và làm mới trạng thái để kiểm tra lại.',
    actionDefault:
      'Chưa thể thực hiện thao tác. Làm mới trạng thái hoặc liên hệ hỗ trợ.',
    loadFailed: 'Không thể tải trạng thái lúc này. Vui lòng thử lại.',
    cleanupHint: 'Có thể giải phóng tài nguyên trước khi tiếp tục hủy Mission.',
    refresh: 'Làm mới trạng thái',
    stepRequested: 'Đã gửi yêu cầu',
    stepConfirmed: 'Xác nhận an toàn',
    stepCleaned: 'Giải phóng tài nguyên',
    stepCancel: 'Hủy Mission',
    progressLabel: 'Tiến độ dừng an toàn',
    recorded: 'Đã ghi nhận',
    notRecorded: 'Chưa ghi nhận',
    confirmedAt: 'Xác nhận lúc',
    copy: {
      staff: {
        notRequested: ['Chưa có yêu cầu', 'Manager chưa yêu cầu dừng Mission.'],
        requested: [
          'Đã yêu cầu dừng',
          'Đưa Mission về trạng thái an toàn, sau đó xác nhận khi đã hoàn tất.',
        ],
        inProgress: [
          'Đang xử lý',
          'Hoàn tất các thao tác an toàn trước khi xác nhận.',
        ],
        confirmed: [
          'Đã xác nhận an toàn',
          'Đang chờ Manager giải phóng tài nguyên.',
        ],
        cleaned: [
          'Đã hoàn tất dừng an toàn',
          'Tài nguyên đã được giải phóng. Không cần xác nhận thêm.',
        ],
        failed: [
          'Cần xử lý lại',
          'Kiểm tra lại tình trạng an toàn của Mission và liên hệ Manager.',
        ],
        unknown: [
          'Cần kiểm tra trạng thái',
          'Làm mới trạng thái trước khi tiếp tục.',
        ],
      },
      manager: {
        notRequested: [
          'Chưa yêu cầu dừng',
          'Mission cần được đưa về trạng thái an toàn trước khi có thể hủy.',
        ],
        requested: [
          'Đã yêu cầu dừng',
          'Đang chờ đội bay đưa Mission về trạng thái an toàn và xác nhận.',
        ],
        inProgress: [
          'Đang xử lý',
          'Đội bay đang đưa Mission về trạng thái an toàn.',
        ],
        confirmed: [
          'Đã xác nhận an toàn',
          'Đội bay đã xác nhận Mission ở trạng thái an toàn.',
        ],
        cleaned: [
          'Sẵn sàng hủy',
          'Tài nguyên vận hành đã được giải phóng. Mission hiện có thể được hủy an toàn.',
        ],
        failed: [
          'Cần xử lý lại',
          'Kiểm tra tình trạng Mission với đội bay trước khi tiếp tục.',
        ],
        unknown: [
          'Cần kiểm tra trạng thái',
          'Làm mới trạng thái trước khi tiếp tục.',
        ],
      },
    },
  },
  en: {
    errors: {
      ACCESS_DENIED: 'You do not have permission to perform this action.',
      UNAUTHORIZED: 'Please sign in again to continue.',
      INVALID_REQUEST: 'Check the confirmation details and try again.',
      EXECUTION_PLAN_REVISION_CONFLICT:
        'The plan has changed. Refresh the status before continuing.',
      EXECUTION_PLAN_NOT_DRAFT:
        'The plan must be reopened for adjustment before continuing to cancel the Mission.',
      MISSION_SAFE_STOP_NOT_READY:
        'The Mission is not in a safe state to continue. Refresh the status or contact the flight crew.',
      MISSION_SAFE_STOP_FAILED:
        'The safe stop is not complete. Contact the flight crew and refresh the status to continue.',
      MISSION_CANCELLATION_REQUIRES_SAFE_STOP:
        'The safe stop must be completed before cancelling the Mission.',
      MISSION_CANCELLATION_NOT_ALLOWED:
        'The Mission is not eligible to cancel yet. Refresh the status to check again.',
      MISSION_RESULT_ALREADY_APPROVED:
        'The result has already been approved; this Mission cannot be cancelled.',
    } as Record<string, string>,
    failureDefault:
      'The safe stop is not complete. Contact the flight crew and refresh the status to check again.',
    actionDefault:
      'The action could not be completed. Refresh the status or contact support.',
    loadFailed: 'Could not load the status right now. Please try again.',
    cleanupHint:
      'Resources can be released before continuing to cancel the Mission.',
    refresh: 'Refresh status',
    stepRequested: 'Request sent',
    stepConfirmed: 'Safety confirmed',
    stepCleaned: 'Resources released',
    stepCancel: 'Cancel Mission',
    progressLabel: 'Safe stop progress',
    recorded: 'Recorded',
    notRecorded: 'Not recorded',
    confirmedAt: 'Confirmed at',
    copy: {
      staff: {
        notRequested: [
          'No request',
          'The Manager has not requested a Mission stop.',
        ],
        requested: [
          'Stop requested',
          'Bring the Mission to a safe state, then confirm when done.',
        ],
        inProgress: [
          'In progress',
          'Complete the safety actions before confirming.',
        ],
        confirmed: [
          'Safety confirmed',
          'Waiting for the Manager to release resources.',
        ],
        cleaned: [
          'Safe stop complete',
          'Resources have been released. No further confirmation needed.',
        ],
        failed: [
          'Needs retry',
          'Re-check the Mission safety status and contact the Manager.',
        ],
        unknown: [
          'Status needs checking',
          'Refresh the status before continuing.',
        ],
      },
      manager: {
        notRequested: [
          'Stop not requested',
          'The Mission must be brought to a safe state before it can be cancelled.',
        ],
        requested: [
          'Stop requested',
          'Waiting for the flight crew to bring the Mission to a safe state and confirm.',
        ],
        inProgress: [
          'In progress',
          'The flight crew is bringing the Mission to a safe state.',
        ],
        confirmed: [
          'Safety confirmed',
          'The flight crew has confirmed the Mission is in a safe state.',
        ],
        cleaned: [
          'Ready to cancel',
          'Operational resources have been released. The Mission can now be cancelled safely.',
        ],
        failed: [
          'Needs retry',
          'Check the Mission status with the flight crew before continuing.',
        ],
        unknown: [
          'Status needs checking',
          'Refresh the status before continuing.',
        ],
      },
    },
  },
})

export const safeStopText = () => safeStopMessages[getLanguage()]
const copy = safeStopText

export function safeStopFailure(reason: string | null): string {
  // Keep arbitrary server diagnostics out of the operational presentation.
  return copy().errors[reason ?? ''] ?? copy().failureDefault
}

export function safeStopError(error: unknown): string {
  return error instanceof ApiError
    ? (copy().errors[error.code ?? ''] ?? copy().actionDefault)
    : copy().loadFailed
}

export const safeStopCopy = (actor: 'staff' | 'manager') =>
  safeStopText().copy[actor]
