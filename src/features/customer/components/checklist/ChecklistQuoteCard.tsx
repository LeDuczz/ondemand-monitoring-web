import { PriceBreakdownView } from '../../../../shared/components/odm/PriceBreakdownView'
import { Card } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { checklistMessages } from '../../lib/checklist/messages'
import type { ChecklistQuoteState } from '../../lib/checklist/useChecklistQuote'

/**
 * Price of the current selection, always computed by the backend. The client only sends which checklists it wants
 * and how many images/videos; it has no way to send a price.
 */
export function ChecklistQuoteCard({ quote }: { quote: ChecklistQuoteState }) {
  const { t } = useI18n(checklistMessages)

  return (
    <Card title={t.quoteTitle}>
      <p className="checklist-hint">{t.quoteHint}</p>
      {quote.loading && <p role="status">{t.quoteLoading}</p>}
      {quote.error && (
        <p role="alert" className="co-notice is-danger">
          {quote.error.message}
        </p>
      )}
      {quote.preview && <PriceBreakdownView preview={quote.preview} />}
    </Card>
  )
}
