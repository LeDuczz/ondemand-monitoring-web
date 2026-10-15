import { StatusBadge } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type { ChecklistReviewStatus, PricingChecklistItem } from '../../types'
import { digits } from '../pricingInput'
import { checklistRowMessages } from './ChecklistRow.messages'

export function ChecklistRow({
  item,
  index,
  price,
  disabled,
  noteOpen,
  onToggleNote,
  onPriceChange,
  onReview,
}: {
  item: PricingChecklistItem
  index: number
  price: string
  disabled: boolean
  noteOpen: boolean
  onToggleNote: () => void
  onPriceChange: (value: string) => void
  onReview: (status: ChecklistReviewStatus, note?: string) => void
}) {
  const { t } = useI18n(checklistRowMessages)
  const statuses: Array<{
    value: Exclude<ChecklistReviewStatus, 'PENDING'>
    label: string
  }> = [
    { value: 'INCLUDED', label: t.included },
    { value: 'ADDITIONAL', label: t.additional },
    { value: 'DUPLICATE', label: t.duplicate },
    { value: 'REJECTED', label: t.rejected },
  ]
  const pending = item.reviewStatus === 'PENDING'

  return (
    <div
      className={`finance-requirement is-${item.reviewStatus.toLowerCase()}`}
    >
      <span className="finance-index">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="finance-requirement-main">
        <strong>{item.content}</strong>
        <span>
          {item.sourceType === 'SERVICE_TEMPLATE'
            ? t.templateSource
            : t.customSource}
        </span>
      </div>
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
      {item.reviewStatus === 'ADDITIONAL' ? (
        <label className="finance-price">
          <span className="finance-sr">{t.extraPrice}</span>
          <input
            inputMode="numeric"
            min="0"
            step="1"
            value={price}
            disabled={disabled}
            onChange={(event) => onPriceChange(digits(event.target.value))}
          />
        </label>
      ) : (
        <div className="finance-zero">
          {t.surcharge}: {formatVnd(0)}
        </div>
      )}
      <StatusBadge tone={pending ? 'neutral' : 'success'}>
        {pending ? t.notReviewed : t.reviewed}
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
