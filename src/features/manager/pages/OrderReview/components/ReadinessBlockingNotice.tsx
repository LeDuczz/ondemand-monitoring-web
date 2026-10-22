import type {
  OrderReadiness,
  ReadinessCriterion,
} from '../../../types/readiness'
import type { FailureAction } from '../readinessTypes'

export function ReadinessBlockingNotice({
  readiness,
  failedRequired,
  editable,
  savingCode,
  submitFailedDecision,
}: {
  readiness: OrderReadiness
  failedRequired: ReadinessCriterion[]
  editable: boolean
  savingCode: string | null
  submitFailedDecision: (decision: FailureAction) => Promise<void>
}) {
  return (
    <div
      className="odm-or-readiness-blocking"
      aria-label="Lý do chưa thể duyệt"
    >
      <ul>
        {readiness.blockingReasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      {failedRequired.length > 0 && editable ? (
        <div className="odm-or-readiness-blocking-actions">
          <button
            type="button"
            className="odm-btn odm-btn-ok"
            disabled={savingCode === 'decision'}
            onClick={() => void submitFailedDecision('NEED_INFO')}
          >
            Yêu cầu bổ sung
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-rd"
            disabled={savingCode === 'decision'}
            onClick={() => void submitFailedDecision('REJECTED')}
          >
            Từ chối đơn
          </button>
        </div>
      ) : null}
    </div>
  )
}
