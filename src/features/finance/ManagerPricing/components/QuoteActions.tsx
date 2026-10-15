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
  approveBlockedReason,
  onSaveDraft,
  onApprove,
}: {
  error: string | null
  message: string | null
  accepted: boolean
  busy: boolean
  approved: boolean
  pendingCustomCount: number
  approveBlockedReason?: string | null
  onSaveDraft: () => void
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
            className="odm-btn"
            type="button"
            disabled={busy}
            onClick={onSaveDraft}
          >
            {t.saveDraft}
          </button>
          <button
            id="manager-approve-quote"
            className="odm-btn odm-btn-p"
            type="button"
            disabled={
              busy ||
              approved ||
              pendingCustomCount > 0 ||
              Boolean(approveBlockedReason)
            }
            title={
              pendingCustomCount > 0
                ? t.classifyFirst
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
