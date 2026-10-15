import { useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import type { ChecklistReviewStatus, PricingChecklistItem } from '../../types'
import type { ChecklistFilter } from '../useManagerPricing'
import { checklistReviewMessages } from './ChecklistReview.messages'
import { ChecklistRow } from './ChecklistRow'

export function ChecklistReview({
  items,
  filter,
  onFilterChange,
  prices,
  disabled,
  onPriceChange,
  onReview,
}: {
  items: PricingChecklistItem[]
  filter: ChecklistFilter
  onFilterChange: (filter: ChecklistFilter) => void
  prices: Record<string, string>
  disabled: boolean
  onPriceChange: (itemId: string, value: string) => void
  onReview: (
    item: PricingChecklistItem,
    status: ChecklistReviewStatus,
    note?: string,
  ) => void
}) {
  const { t } = useI18n(checklistReviewMessages)
  const [openNote, setOpenNote] = useState<string | null>(null)

  const checklistCount = items.length
  const pendingReviewCount = items.filter(
    (item) => !item.reviewStatus || item.reviewStatus === 'PENDING',
  ).length
  const reviewedCount = checklistCount - pendingReviewCount
  const reviewComplete = pendingReviewCount === 0
  const additionalCount = items.filter(
    (item) => item.reviewStatus === 'ADDITIONAL',
  ).length
  const percent = checklistCount ? (reviewedCount / checklistCount) * 100 : 0
  const filters = [
    { key: 'all', label: t.filterAll, count: checklistCount },
    { key: 'pending', label: t.filterPending, count: pendingReviewCount },
    { key: 'reviewed', label: t.filterReviewed, count: reviewedCount },
    { key: 'additional', label: t.filterAdditional, count: additionalCount },
  ] as const
  const visibleItems = items.filter((item) =>
    filter === 'pending'
      ? item.reviewStatus === 'PENDING'
      : filter === 'reviewed'
        ? item.reviewStatus !== 'PENDING'
        : filter === 'additional'
          ? item.reviewStatus === 'ADDITIONAL'
          : true,
  )
  const state = reviewComplete ? 'is-complete' : 'is-pending'

  return (
    <>
      <div className="finance-toolbar">
        <div className={`finance-review-progress ${state}`} role="status">
          <strong>{t.reviewedOf(reviewedCount, checklistCount)}</strong>
          <span className="finance-progress-percent">
            ({Math.round(percent)}%)
          </span>
          <span className="finance-progress-track">
            <span style={{ width: `${percent}%` }} />
          </span>
        </div>
        <div className="finance-filters" role="group" aria-label={t.filterAria}>
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`finance-filter${filter === item.key ? ' is-on' : ''}`}
              aria-pressed={filter === item.key}
              onClick={() => onFilterChange(item.key)}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
      </div>
      <div className={`finance-review-warning ${state}`} role="status">
        <span aria-hidden="true" className="finance-review-warning-icon">
          {reviewComplete ? '✓' : '!'}
        </span>
        {reviewComplete ? t.complete : t.pending(pendingReviewCount)}
      </div>
      <div className="finance-checklist">
        <div className="finance-table-head" aria-hidden="true">
          <span>#</span>
          <span>{t.colContent}</span>
          <span>{t.colMethod}</span>
          <span>{t.colSurcharge}</span>
          <span>{t.colStatus}</span>
          <span>{t.colNote}</span>
        </div>
        {visibleItems.map((item) => (
          <ChecklistRow
            key={item.id}
            item={item}
            index={items.indexOf(item)}
            price={prices[item.id] ?? '0'}
            disabled={disabled}
            noteOpen={openNote === item.id}
            onToggleNote={() =>
              setOpenNote(openNote === item.id ? null : item.id)
            }
            onPriceChange={(value) => onPriceChange(item.id, value)}
            onReview={(status, note) => onReview(item, status, note)}
          />
        ))}
      </div>
    </>
  )
}
