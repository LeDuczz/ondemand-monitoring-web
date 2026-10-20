import { FormField } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { SummaryRow } from '../../components/common/SummaryRow'
import { MIN_REASON_LENGTH, type PricingDraft } from '../pricingInput'
import { priceBreakdownMessages } from './PriceBreakdown.messages'

export function PriceBreakdown({
  draft,
  systemPrice,
  adjustment,
  total,
  pendingReviewCount,
  disabled,
  onChange,
}: {
  draft: PricingDraft
  systemPrice: number
  /** Sum of the manager's per-item changes against the system price. */
  adjustment: number
  total: number
  pendingReviewCount: number
  disabled: boolean
  onChange: (patch: Partial<PricingDraft>) => void
}) {
  const { t } = useI18n(priceBreakdownMessages)
  const reasonLength = draft.adjustmentReason.trim().length

  return (
    <>
      <dl className="odm-or-kv finance-kv">
        <SummaryRow label={t.systemPrice} value={systemPrice} />
        <SummaryRow
          label={t.adjustment}
          value={adjustment}
          signed
          tone={adjustment > 0 ? 'up' : adjustment < 0 ? 'down' : undefined}
        />
        <SummaryRow label={t.quoteTotal} value={total} total />
      </dl>
      {pendingReviewCount > 0 && (
        <p className="finance-block-hint">
          {t.pendingHint(pendingReviewCount)}
        </p>
      )}
      {adjustment !== 0 || draft.adjustmentReason ? (
        <div className="finance-quote-note">
          <FormField
            id="pricing-adjustment-reason"
            label={`${t.reasonLabel} (${t.reasonRequired(MIN_REASON_LENGTH)})`}
          >
            <textarea
              id="pricing-adjustment-reason"
              rows={3}
              value={draft.adjustmentReason}
              disabled={disabled}
              aria-invalid={adjustment !== 0 && reasonLength < MIN_REASON_LENGTH}
              onChange={(event) =>
                onChange({ adjustmentReason: event.target.value })
              }
            />
          </FormField>
          <small>{t.reasonCount(reasonLength, MIN_REASON_LENGTH)}</small>
        </div>
      ) : null}
      <div className="finance-quote-note">
        <FormField id="pricing-note" label={t.noteLabel}>
          <textarea
            id="pricing-note"
            rows={3}
            maxLength={500}
            placeholder={t.notePlaceholder}
            value={draft.managerNote}
            disabled={disabled}
            onChange={(event) => onChange({ managerNote: event.target.value })}
          />
        </FormField>
        <small>{draft.managerNote.length}/500</small>
      </div>
    </>
  )
}
