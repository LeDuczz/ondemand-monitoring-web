import { FormField } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { SummaryRow } from '../../components/common/SummaryRow'
import {
  amount,
  digits,
  signedDigits,
  type PricingDraft,
} from '../pricingInput'
import { priceBreakdownMessages } from './PriceBreakdown.messages'

export function PriceBreakdown({
  draft,
  additional,
  total,
  pendingReviewCount,
  disabled,
  onChange,
}: {
  draft: PricingDraft
  additional: number
  total: number
  pendingReviewCount: number
  disabled: boolean
  onChange: (patch: Partial<PricingDraft>) => void
}) {
  const { t } = useI18n(priceBreakdownMessages)

  return (
    <>
      <dl className="odm-or-kv finance-kv">
        <SummaryRow label={t.packagePrice} value={amount(draft.packagePrice)} />
        <SummaryRow label={t.additionalCost} value={additional} />
        <SummaryRow label={t.discount} value={-amount(draft.discountAmount)} />
        <SummaryRow
          label={t.adjustment}
          value={amount(draft.adjustmentAmount)}
        />
        <SummaryRow label={t.quoteTotal} value={total} total />
      </dl>
      {pendingReviewCount > 0 && (
        <p className="finance-block-hint">
          {t.pendingHint(pendingReviewCount)}
        </p>
      )}
      <details className="finance-adjustments">
        <summary>{t.adjustQuote}</summary>
        <div className="finance-inputs">
          <FormField
            id="pricing-package-price"
            label={`${t.packagePrice} (${t.vnd})`}
          >
            <input
              id="pricing-package-price"
              inputMode="numeric"
              value={draft.packagePrice}
              disabled={disabled}
              onChange={(event) =>
                onChange({ packagePrice: digits(event.target.value) })
              }
            />
          </FormField>
          <FormField id="pricing-discount" label={`${t.discount} (${t.vnd})`}>
            <input
              id="pricing-discount"
              inputMode="numeric"
              value={draft.discountAmount}
              disabled={disabled}
              onChange={(event) =>
                onChange({ discountAmount: digits(event.target.value) })
              }
            />
          </FormField>
          <FormField
            id="pricing-adjustment"
            label={`${t.adjustmentSigned} (${t.vnd})`}
          >
            <input
              id="pricing-adjustment"
              inputMode="numeric"
              value={draft.adjustmentAmount}
              disabled={disabled}
              onChange={(event) =>
                onChange({ adjustmentAmount: signedDigits(event.target.value) })
              }
            />
          </FormField>
        </div>
      </details>
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
