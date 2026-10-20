import { useI18n } from '../../../../shared/i18n'
import { FinanceAlert } from '../../components/common/FinanceAlert'
import { quoteActionsMessages } from './QuoteActions.messages'

export function QuoteActions({
  error,
  message,
  accepted,
  busy,
  approved,
  pendingCustomCount,
  outOfRangeCount,
  approveBlockedReason,
  onApprove,
}: {
  error: string | null
  message: string | null
  accepted: boolean
  busy: boolean
  approved: boolean
  pendingCustomCount: number
  outOfRangeCount: number
  approveBlockedReason?: string | null
  onApprove: () => void
}) {
  const { t } = useI18n(quoteActionsMessages)

  return (
    <>
      {error ? <FinanceAlert tone="error">{error}</FinanceAlert> : null}
      {message ? <FinanceAlert tone="success">{message}</FinanceAlert> : null}
      {!accepted ? (
        <div className="finance-actions">
          <button
            id="manager-approve-quote"
            className="odm-btn odm-btn-p"
            type="button"
            disabled={
              busy ||
              approved ||
              pendingCustomCount > 0 ||
              outOfRangeCount > 0 ||
              Boolean(approveBlockedReason)
            }
            title={
              pendingCustomCount > 0
                ? t.classifyFirst
                : outOfRangeCount > 0
                  ? t.outOfRange
                  : (approveBlockedReason ?? undefined)
            }
            onClick={onApprove}
          >
            {approved ? t.approved : t.approve}
          </button>
        </div>
      ) : null}
    </>
  )
}
