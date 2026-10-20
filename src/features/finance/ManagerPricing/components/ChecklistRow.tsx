import { StatusBadge } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import type { ChecklistReviewStatus, PricingChecklistItem } from '../../types'
import { isManagerPriced } from '../pricingInput'
import { checklistRowMessages } from './ChecklistRow.messages'
import { ItemPrice, type PriceRange } from './ItemPrice'

export function ChecklistRow({
  item,
  index,
  price,
  systemPrice,
  range,
  disabled,
  noteOpen,
  onToggleNote,
  onPriceChange,
  onReview,
}: {
  item: PricingChecklistItem
  index: number
  /** Draft/approved price shown in the input (VND digits). */
  price: string
  /** What the pricing policy in force charges for this item. */
  systemPrice: number
  range: PriceRange | null
  disabled: boolean
  noteOpen: boolean
  onToggleNote: () => void
  onPriceChange: (value: string) => void
  onReview: (status: ChecklistReviewStatus, note?: string) => void
}) {
  const { t } = useI18n(checklistRowMessages)
  // The default package is priced automatically and never reviewed by hand.
  const packaged = item.sourceType === 'SERVICE_TEMPLATE'
  const statuses: Array<{
    value: Exclude<ChecklistReviewStatus, 'PENDING'>
    label: string
  }> = [
    { value: 'ADDITIONAL', label: t.additional },
    { value: 'DUPLICATE', label: t.duplicate },
    { value: 'REJECTED', label: t.rejected },
  ]
  const pending = item.reviewStatus === 'PENDING'
  const managerPriced = isManagerPriced(item)
  const awaitingPrice =
    managerPriced &&
    item.managerApprovedAmount == null &&
    item.managerQuotedPrice == null
  const requestedMedia =
    (item.requestedImageCount ?? 0) + (item.requestedVideoCount ?? 0)

  return (
    <div
      className={`finance-requirement is-${item.reviewStatus.toLowerCase()}`}
    >
      <span className="finance-index">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="finance-requirement-main">
        <strong>{item.content}</strong>
        <span>{packaged ? t.templateSource : t.customSource}</span>
        {requestedMedia > 0 ? (
          <span>
            {t.requestedMedia(
              item.requestedImageCount ?? 0,
              item.requestedVideoCount ?? 0,
            )}
          </span>
        ) : null}
      </div>
      {packaged ? (
        <div className="finance-zero">{t.includedInPackage}</div>
      ) : (
        <label className="finance-status-select">
          <span className="finance-sr">{t.classify}</span>
          <select
            value={item.reviewStatus}
            disabled={disabled}
            onChange={(event) =>
              onReview(event.target.value as ChecklistReviewStatus)
            }
          >
            <option value="PENDING" disabled>
              {t.notReviewed}
            </option>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <ItemPrice
        systemPrice={systemPrice}
        price={price}
        range={range}
        managerPriced={managerPriced}
        disabled={disabled}
        onChange={onPriceChange}
      />
      <StatusBadge
        tone={
          packaged
            ? 'info'
            : pending
              ? 'neutral'
              : awaitingPrice
                ? 'warning'
                : 'success'
        }
      >
        {packaged
          ? t.autoPriced
          : pending
            ? t.notReviewed
            : awaitingPrice
              ? t.awaitingPrice
              : t.reviewed}
      </StatusBadge>
      <button
        type="button"
        className="finance-chevron"
        aria-label={t.noteAria(item.content)}
        aria-expanded={noteOpen}
        onClick={onToggleNote}
      >
        <span aria-hidden="true">⌄</span>
      </button>
      {noteOpen ? (
        <label className="finance-note">
          <span>{t.managerNote}</span>
          <input
            defaultValue={item.managerNote ?? ''}
            disabled={disabled || pending}
            placeholder={pending ? t.classifyFirst : t.notePlaceholder}
            onBlur={(event) => onReview(item.reviewStatus, event.target.value)}
          />
        </label>
      ) : null}
    </div>
  )
}
