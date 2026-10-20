import { useEffect, useRef, useState } from 'react'

import { ApiError } from '../../shared/api/httpClient'
import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { formatVnd } from '../../shared/lib/formatVnd'
import {
  pricingDescription,
  pricingLabel,
} from '../../shared/lib/pricingPresentation'
import { financeApi } from './api'
import type { ChecklistReviewStatus, PricingChecklistItem } from './types'
import './finance.css'

const statuses: Array<{
  value: Exclude<ChecklistReviewStatus, 'PENDING'>
  label: string
}> = [
  { value: 'ADDITIONAL', label: 'Tính phí bổ sung' },
  { value: 'DUPLICATE', label: 'Trùng lặp' },
  { value: 'REJECTED', label: 'Từ chối' },
]

type Draft = {
  packagePrice: string
  discountAmount: string
  adjustmentAmount: string
  managerNote: string
  adjustmentReason: string
  adjustmentType:
    'DISCOUNT' | 'PROMOTION' | 'COMPENSATION' | 'GOODWILL' | 'CORRECTION'
  approvalNote: string
  prices: Record<string, string>
}
const emptyDraft: Draft = {
  packagePrice: '0',
  discountAmount: '0',
  adjustmentAmount: '0',
  managerNote: '',
  adjustmentReason: '',
  adjustmentType: 'CORRECTION',
  approvalNote: '',
  prices: {},
}

export function ManagerPricingPanel({
  orderId,
  onApproved,
  onChecklistReviewChanged,
  approveBlockedReason,
}: {
  orderId: string
  onApproved?: () => void
  onChecklistReviewChanged?: () => void
  /** Why approving is not allowed yet (approval criteria not met); null/undefined = allowed. */
  approveBlockedReason?: string | null
}) {
  const query = useApiQuery(
    (signal) => financeApi.getPricingReview(orderId, signal),
    [orderId],
  )
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'reviewed' | 'additional'
  >('all')
  const [openNote, setOpenNote] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [approvalSucceeded, setApprovalSucceeded] = useState(false)
  const dirtyPriceIds = useRef(new Set<string>())
  const initializedQuoteKey = useRef<string | null>(null)

  useEffect(() => {
    setApprovalSucceeded(false)
    dirtyPriceIds.current.clear()
    initializedQuoteKey.current = null
    setDraft(emptyDraft)
  }, [orderId])

  useEffect(() => {
    const quote = query.data?.currentQuote
    if (!query.data) return
    const quoteKey = quote
      ? `${quote.id}:${quote.pricingRevision ?? quote.version}`
      : `new:${orderId}`
    setDraft((state) => {
      const prices = { ...state.prices }
      for (const item of query.data!.checklistItems) {
        if (item.sourceType === 'SERVICE_TEMPLATE') continue
        if (dirtyPriceIds.current.has(item.id)) continue
        prices[item.id] = String(
          item.managerApprovedAmount ??
            item.managerQuotedPrice ??
            liveSystemPrice(item, query.data!.systemCalculation?.items),
        )
      }
      const firstLoad = initializedQuoteKey.current !== quoteKey
      initializedQuoteKey.current = quoteKey
      if (!firstLoad) return { ...state, prices }
      return {
        ...state,
        packagePrice: String(
          quote?.packagePrice ??
            query.data!.systemCalculation?.systemCalculatedAmount ??
            query.data!.basePackagePrice,
        ),
        discountAmount: String(quote?.discountAmount ?? 0),
        adjustmentAmount: '0',
        managerNote: quote?.managerNote ?? '',
        adjustmentReason: quote?.adjustmentReason ?? '',
        adjustmentType: quote?.adjustmentType ?? 'CORRECTION',
        approvalNote: '',
        prices,
      }
    })
  }, [orderId, query.data])

  const pendingReviewCount = (query.data?.checklistItems ?? []).filter(
    (item) =>
      item.sourceType !== 'SERVICE_TEMPLATE' &&
      (!item.reviewStatus || item.reviewStatus === 'PENDING'),
  ).length
  const pendingCustomCount = (query.data?.checklistItems ?? []).filter(
    (item) =>
      (!item.reviewStatus || item.reviewStatus === 'PENDING') &&
      item.sourceType === 'CUSTOMER_CUSTOM',
  ).length
  const checklistCount = query.data?.checklistItems.length ?? 0
  const reviewedCount = checklistCount - pendingReviewCount
  const reviewComplete = pendingReviewCount === 0
  const systemPrice =
    query.data?.systemCalculation?.systemCalculatedAmount ??
    amount(draft.packagePrice)
  // Until the draft prices are initialised an item is at its own starting price, i.e. not adjusted.
  const startingPrices = approvedPrices(
    query.data?.checklistItems ?? [],
    draft,
    query.data?.systemCalculation?.items,
  )
  const priceRange = (system: number) =>
    priceLimits(
      system,
      query.data?.managerMaxDiscountPercent,
      query.data?.managerMaxMarkupPercent,
    )
  const outOfRangeCount = (query.data?.checklistItems ?? []).filter((item) => {
    if (!isManagerPriced(item)) return false
    const system = liveSystemPrice(item, query.data?.systemCalculation?.items)
    const range = priceRange(system)
    const price = startingPrices[item.id]
    return (
      range !== null &&
      price !== system &&
      (price < range.min || price > range.max)
    )
  }).length
  const checklistAdjustment = (query.data?.checklistItems ?? [])
    .filter(isManagerPriced)
    .reduce(
      (sum, item) =>
        sum +
        startingPrices[item.id] -
        liveSystemPrice(item, query.data?.systemCalculation?.items),
      0,
    )
  const total = systemPrice + checklistAdjustment

  async function updateReview(
    item: PricingChecklistItem,
    status: ChecklistReviewStatus,
    managerNote = item.managerNote ?? '',
  ) {
    setError(null)
    try {
      await financeApi.reviewChecklist(orderId, item.id, {
        status,
        managerNote: managerNote.trim() || null,
      })
      query.reload()
      onChecklistReviewChanged?.()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  /** The backend wants a meaningful reason (at least 10 characters) whenever the total differs from the system price. */
  function reasonProblem() {
    const adjusted =
      checklistAdjustment !== 0 || amount(draft.adjustmentAmount) !== 0
    const length = draft.adjustmentReason.trim().length
    if (!adjusted || length >= MIN_REASON_LENGTH) return null
    return length === 0
      ? 'Vui lòng nhập lý do điều chỉnh giá.'
      : `Lý do điều chỉnh cần ít nhất ${MIN_REASON_LENGTH} ký tự (hiện có ${length}).`
  }

  async function approve() {
    if (!query.data) return
    const problem = reasonProblem()
    if (problem) {
      setMessage(null)
      setError(problem)
      return
    }
    if (outOfRangeCount > 0) {
      setMessage(null)
      setError(
        `Còn ${outOfRangeCount} mục có giá duyệt ngoài khoảng cho phép. Sửa các mục báo đỏ rồi duyệt lại.`,
      )
      return
    }
    if (pendingCustomCount > 0) {
      setMessage(null)
      setError(
        `Còn ${pendingCustomCount} yêu cầu bổ sung của khách hàng chưa được phân loại.`,
      )
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const quote = await financeApi.saveDraft(orderId, {
        packagePrice: systemPrice,
        discountAmount: 0,
        adjustmentAmount: amount(draft.adjustmentAmount),
        managerNote: draft.managerNote.trim() || null,
        additionalUnitPrices: approvedPrices(
          query.data.checklistItems,
          draft,
          query.data.systemCalculation?.items,
        ),
        adjustmentReason: draft.adjustmentReason.trim() || null,
        adjustmentType: draft.adjustmentType,
        expectedPricingRevision:
          query.data.currentQuote?.pricingRevision ?? null,
        expectedPolicyVersion:
          query.data.systemCalculation?.policyVersion ?? null,
      })
      dirtyPriceIds.current.clear()
      await financeApi.approveQuote(orderId, quote.id)
      setApprovalSucceeded(true)
      onApproved?.()
      setMessage(
        'Duyệt báo giá thành công. Báo giá đã sẵn sàng để khách hàng chấp nhận.',
      )
      query.reload()
    } catch (cause) {
      setError(errorMessage(cause))
      if (cause instanceof ApiError && cause.code === 'STALE_PRICING_POLICY') {
        // Show the Manager the prices that now apply; typed prices would be judged against the old ones.
        dirtyPriceIds.current.clear()
        query.reload()
      }
    } finally {
      setBusy(false)
    }
  }

  if (query.loading && !query.data)
    return (
      <div className="finance-workspace">
        <section className="odm-or-card finance-panel finance-fallback">
          Đang tải thông tin giá...
        </section>
        <div className="finance-sidebar">
          <aside className="odm-or-card finance-quote finance-fallback">
            {null}
            <div className="finance-quote-body">
              <div className="finance-quote-content">Đang tải báo giá...</div>
            </div>
          </aside>
        </div>
      </div>
    )
  if (!query.data)
    return (
      <div className="finance-workspace">
        <section className="odm-or-card finance-panel finance-error finance-fallback">
          {errorMessage(query.error)}
        </section>
        <div className="finance-sidebar">
          <aside className="odm-or-card finance-quote finance-fallback">
            {null}
            <div className="finance-quote-body">
              <div className="finance-quote-content" />
            </div>
          </aside>
        </div>
      </div>
    )
  const approved =
    approvalSucceeded || query.data.currentQuote?.status === 'APPROVED'
  const accepted = query.data.currentQuote?.status === 'ACCEPTED_BY_CUSTOMER'
  const additionalCount = query.data.checklistItems.filter(
    (item) => item.reviewStatus === 'ADDITIONAL',
  ).length
  const filterLabels = [
    { key: 'all', label: 'Tất cả', count: checklistCount },
    { key: 'pending', label: 'Chưa xem xét', count: pendingReviewCount },
    { key: 'reviewed', label: 'Đã xem xét', count: reviewedCount },
    { key: 'additional', label: 'Có phụ phí', count: additionalCount },
  ] as const
  const visibleItems = query.data.checklistItems.filter((item) =>
    filter === 'pending'
      ? item.sourceType !== 'SERVICE_TEMPLATE' &&
        item.reviewStatus === 'PENDING'
      : filter === 'reviewed'
        ? item.reviewStatus !== 'PENDING'
        : filter === 'additional'
          ? item.reviewStatus === 'ADDITIONAL'
          : true,
  )

  return (
    <div className="finance-workspace">
      <section
        className="odm-or-card finance-panel"
        aria-labelledby="manager-pricing-title"
      >
        <header className="finance-heading">
          <div>
            <h2 id="manager-pricing-title">Xem xét yêu cầu và báo giá</h2>
            <p>Mỗi yêu cầu phải được phân loại trước khi duyệt báo giá.</p>
          </div>
          {query.data.currentQuote ? (
            <span
              className={`finance-status is-${query.data.currentQuote.status.toLowerCase()}`}
            >
              v{query.data.currentQuote.version} ·{' '}
              {pricingLabel(query.data.currentQuote.status)}
            </span>
          ) : null}
        </header>
        <div className="finance-toolbar">
          <div
            className={`finance-review-progress ${reviewComplete ? 'is-complete' : 'is-pending'}`}
            role="status"
          >
            <strong>
              {reviewedCount}/{checklistCount} nội dung đã xem xét
            </strong>
            <span className="finance-progress-percent">
              (
              {checklistCount
                ? Math.round((reviewedCount / checklistCount) * 100)
                : 0}
              %)
            </span>
            <span className="finance-progress-track">
              <span
                style={{
                  width: `${checklistCount ? (reviewedCount / checklistCount) * 100 : 0}%`,
                }}
              />
            </span>
          </div>
          <div
            className="finance-filters"
            role="group"
            aria-label="Lọc nội dung"
          >
            {filterLabels.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`finance-filter${filter === item.key ? ' is-on' : ''}`}
                aria-pressed={filter === item.key}
                onClick={() => setFilter(item.key)}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>
        </div>
        <div
          className={`finance-review-warning ${reviewComplete ? 'is-complete' : 'is-pending'}`}
          role="status"
        >
          <span aria-hidden="true" className="finance-review-warning-icon">
            {reviewComplete ? '✓' : '!'}
          </span>
          {reviewComplete
            ? 'Checklist đã hoàn tất và có thể duyệt báo giá.'
            : `Còn ${pendingReviewCount} nội dung cần chọn cách tính giá trước khi duyệt.`}
        </div>
        <div className="finance-checklist">
          <div className="finance-table-head" aria-hidden="true">
            <span>#</span>
            <span>Nội dung yêu cầu</span>
            <span>Cách tính giá</span>
            <span>Phụ phí</span>
            <span>Trạng thái</span>
            <span>Ghi chú</span>
          </div>
          {visibleItems.map((item) => (
            <div
              className={`finance-requirement is-${item.reviewStatus.toLowerCase()}`}
              key={item.id}
            >
              <span className="finance-index">
                {String(query.data!.checklistItems.indexOf(item) + 1).padStart(
                  2,
                  '0',
                )}
              </span>
              <div className="finance-requirement-main">
                <strong>{item.content}</strong>
                <span>
                  {item.sourceType === 'SERVICE_TEMPLATE'
                    ? 'Yêu cầu mặc định của gói'
                    : 'Yêu cầu thêm của khách hàng'}
                </span>
                {(item.requestedImageCount ?? 0) +
                  (item.requestedVideoCount ?? 0) >
                0 ? (
                  <span>
                    Khách yêu cầu: {item.requestedImageCount ?? 0} ảnh ·{' '}
                    {item.requestedVideoCount ?? 0} video
                  </span>
                ) : null}
              </div>
              {item.sourceType === 'SERVICE_TEMPLATE' ? (
                <div className="finance-zero">Đã gồm trong gói</div>
              ) : (
                <label className="finance-status-select">
                  <span className="finance-sr">Phân loại</span>
                  <select
                    value={item.reviewStatus}
                    disabled={accepted}
                    onChange={(event) =>
                      void updateReview(
                        item,
                        event.target.value as ChecklistReviewStatus,
                      )
                    }
                  >
                    <option value="PENDING" disabled>
                      Chưa xem xét
                    </option>
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="finance-item-price">
                <small>
                  Giá hệ thống:{' '}
                  {formatVnd(
                    liveSystemPrice(item, query.data?.systemCalculation?.items),
                  )}
                </small>
                {isManagerPriced(item) ? (
                  <MoneyInput
                    label="Giá duyệt"
                    value={
                      draft.prices[item.id] ??
                      String(
                        item.managerApprovedAmount ??
                          item.managerQuotedPrice ??
                          liveSystemPrice(
                            item,
                            query.data?.systemCalculation?.items,
                          ),
                      )
                    }
                    onChange={(value) =>
                      setDraft((state) => {
                        dirtyPriceIds.current.add(item.id)
                        return {
                          ...state,
                          prices: { ...state.prices, [item.id]: value },
                        }
                      })
                    }
                    disabled={accepted}
                  />
                ) : null}
                {isManagerPriced(item) ? (
                  <PriceDifference
                    system={liveSystemPrice(
                      item,
                      query.data?.systemCalculation?.items,
                    )}
                    range={priceRange(
                      liveSystemPrice(
                        item,
                        query.data?.systemCalculation?.items,
                      ),
                    )}
                    proposed={amount(
                      draft.prices[item.id] ??
                        String(
                          item.managerApprovedAmount ??
                            item.managerQuotedPrice ??
                            liveSystemPrice(
                              item,
                              query.data?.systemCalculation?.items,
                            ),
                        ),
                    )}
                  />
                ) : null}
              </div>
              <span
                className={`finance-review-badge is-${item.reviewStatus.toLowerCase()}`}
              >
                {item.sourceType === 'SERVICE_TEMPLATE'
                  ? 'Tự động tính giá'
                  : item.reviewStatus === 'PENDING'
                    ? 'Chưa xem xét'
                    : isManagerPriced(item) &&
                        item.managerApprovedAmount == null &&
                        item.managerQuotedPrice == null
                      ? 'Chờ duyệt giá'
                      : 'Đã xem xét'}
              </span>
              <button
                type="button"
                className="finance-chevron"
                aria-label={`Ghi chú: ${item.content}`}
                aria-expanded={openNote === item.id}
                onClick={() =>
                  setOpenNote(openNote === item.id ? null : item.id)
                }
              >
                <span aria-hidden="true">⌄</span>
              </button>
              {openNote === item.id ? (
                <label className="finance-note">
                  <span>Ghi chú của quản lý</span>
                  <input
                    defaultValue={item.managerNote ?? ''}
                    disabled={accepted || item.reviewStatus === 'PENDING'}
                    placeholder={
                      item.reviewStatus === 'PENDING'
                        ? 'Phân loại nội dung trước'
                        : 'Lý do hoặc phạm vi xử lý'
                    }
                    onBlur={(event) =>
                      void updateReview(
                        item,
                        item.reviewStatus,
                        event.target.value,
                      )
                    }
                  />
                </label>
              ) : null}
            </div>
          ))}
        </div>
      </section>
      <div className="finance-sidebar">
        <aside
          className="odm-or-card finance-quote"
          aria-label="Tóm tắt báo giá"
        >
          <header className="finance-heading finance-quote-heading">
            <h2>Tóm tắt báo giá</h2>
            <span className="finance-policy-pill">
              Chính sách giá v
              {query.data.systemCalculation?.policyVersion ??
                query.data.currentQuote?.pricingPolicyVersion ??
                '—'}
            </span>
          </header>
          <div className="finance-quote-body">
            <div className="finance-quote-content">
              <QuoteBreakdown
                items={query.data.systemCalculation?.items ?? []}
                checklistItems={query.data.checklistItems}
              />
              <dl className="finance-summary">
                <Row label="Giá hệ thống" value={systemPrice} />
                <Row
                  label="Điều chỉnh"
                  value={checklistAdjustment}
                  signed
                  tone={
                    checklistAdjustment > 0
                      ? 'up'
                      : checklistAdjustment < 0
                        ? 'down'
                        : undefined
                  }
                />
                <Row label="Tổng báo giá" value={total} total />
              </dl>
              {!reviewComplete && (
                <p className="finance-block-hint">
                  Còn {pendingReviewCount} nội dung cần xem xét trước khi duyệt.
                </p>
              )}
              {checklistAdjustment !== 0 || draft.adjustmentReason ? (
                <label className="finance-quote-note">
                  <span>
                    Lý do điều chỉnh giá{' '}
                    <em>(bắt buộc, ít nhất {MIN_REASON_LENGTH} ký tự)</em>
                  </span>
                  <textarea
                    rows={3}
                    value={draft.adjustmentReason}
                    disabled={accepted}
                    aria-invalid={
                      checklistAdjustment !== 0 &&
                      draft.adjustmentReason.trim().length < MIN_REASON_LENGTH
                    }
                    onChange={(event) =>
                      setDraft((state) => ({
                        ...state,
                        adjustmentReason: event.target.value,
                      }))
                    }
                  />
                  <small>
                    {draft.adjustmentReason.trim().length}/{MIN_REASON_LENGTH}{' '}
                    ký tự tối thiểu
                  </small>
                </label>
              ) : null}
              <label className="finance-quote-note">
                <span>Ghi chú báo giá (tùy chọn)</span>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Thêm ghi chú cho báo giá..."
                  value={draft.managerNote}
                  disabled={accepted}
                  onChange={(event) =>
                    setDraft((state) => ({
                      ...state,
                      managerNote: event.target.value,
                    }))
                  }
                />
                <small>{draft.managerNote.length}/500</small>
              </label>
              {error ? (
                <p className="finance-alert is-error" role="alert">
                  {error}
                </p>
              ) : null}
              {message ? (
                <p
                  className="finance-alert is-success"
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </p>
              ) : null}
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
                        ? 'Phân loại các yêu cầu bổ sung trước khi duyệt báo giá'
                        : outOfRangeCount > 0
                          ? 'Có giá duyệt ngoài khoảng cho phép'
                          : (approveBlockedReason ?? undefined)
                    }
                    onClick={() => void approve()}
                  >
                    {approved ? 'Đã duyệt thành công' : 'Duyệt báo giá'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function MoneyInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  return (
    <label>
      <span>{label} (VND)</span>
      <input
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(digits(event.target.value))}
      />
    </label>
  )
}
function Row({
  label,
  value,
  total = false,
  signed = false,
  tone,
}: {
  label: string
  value: number
  total?: boolean
  signed?: boolean
  tone?: 'up' | 'down'
}) {
  return (
    <div className={total ? 'is-total' : ''}>
      <dt>{label}</dt>
      <dd className={tone ? `is-${tone}` : undefined}>
        {signed && value > 0 ? '+' : ''}
        {formatVnd(value)}
      </dd>
    </div>
  )
}
function PriceDifference({
  system,
  proposed,
  range,
}: {
  system: number
  proposed: number
  /** Prices the Manager may approve; null when the policy limits are unknown. */
  range: { min: number; max: number } | null
}) {
  const difference = proposed - system
  const percent = system === 0 ? null : (difference / system) * 100
  const sign = difference > 0 ? '+' : ''
  const outside =
    range !== null &&
    difference !== 0 &&
    (proposed < range.min || proposed > range.max)
  return (
    <>
      <small className={difference === 0 ? '' : 'finance-price-difference'}>
        Chênh lệch: {sign}
        {formatVnd(difference)}
        {percent == null
          ? ''
          : ` (${percent > 0 ? '+' : ''}${percent.toLocaleString('vi-VN', {
              maximumFractionDigits: 4,
            })}%)`}
      </small>
      {range && (
        <small
          className={outside ? 'finance-range is-out' : 'finance-range'}
          role={outside ? 'alert' : undefined}
        >
          {outside ? 'Ngoài khoảng cho phép: ' : 'Được duyệt: '}
          {formatVnd(range.min)} – {formatVnd(range.max)}
        </small>
      )}
    </>
  )
}
/** Same bounds the server enforces: the policy's maximum discount and markup on this item's system price. */
function priceLimits(
  system: number,
  maxDiscountPercent: number | null | undefined,
  maxMarkupPercent: number | null | undefined,
) {
  if (system <= 0 || maxDiscountPercent == null || maxMarkupPercent == null)
    return null
  return {
    min: Math.ceil((system * (100 - maxDiscountPercent)) / 100),
    max: Math.floor((system * (100 + maxMarkupPercent)) / 100),
  }
}
function amount(value: string | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isSafeInteger(parsed) ? parsed : 0
}
/**
 * What the pricing policy in force charges for this checklist now. The price stored on the item is only what it was when the
 * order was created, so the live calculation wins whenever it covers the item.
 */
function liveSystemPrice(
  item: PricingChecklistItem,
  lines:
    Array<{ orderChecklistItemId?: string | null; amount: number }> | undefined,
) {
  const mine = (lines ?? []).filter(
    (line) => line.orderChecklistItemId === item.id,
  )
  if (mine.length === 0) return item.systemCalculatedPrice ?? 0
  return mine.reduce((sum, line) => sum + line.amount, 0)
}
function approvedPrices(
  items: PricingChecklistItem[],
  draft: Draft,
  lines:
    Array<{ orderChecklistItemId?: string | null; amount: number }> | undefined,
) {
  return Object.fromEntries(
    items
      .filter(isManagerPriced)
      .map((item) => [
        item.id,
        draft.prices[item.id] == null
          ? (item.managerApprovedAmount ??
            item.managerQuotedPrice ??
            liveSystemPrice(item, lines))
          : amount(draft.prices[item.id]),
      ]),
  )
}
function isManagerPriced(item: PricingChecklistItem) {
  return (
    item.sourceType !== 'SERVICE_TEMPLATE' &&
    item.reviewStatus !== 'REJECTED' &&
    item.reviewStatus !== 'DUPLICATE' &&
    (item.managerQuoteRequired || item.reviewStatus === 'ADDITIONAL')
  )
}
const MIN_REASON_LENGTH = 10

function digits(value: string) {
  return value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '') || '0'
}
function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'CUSTOM_WORK_PRICING_INCOMPLETE') return error.message
    const messages: Record<string, string> = {
      ORDER_CHECKLIST_REVIEW_INVALID:
        'Danh sách yêu cầu chưa được xem xét đầy đủ. Hãy phân loại tất cả nội dung trước khi duyệt báo giá.',
      STALE_PRICING_POLICY:
        'Chính sách giá vừa được cập nhật. Giá trên màn hình đã được tải lại, vui lòng kiểm tra rồi duyệt lại.',
      STALE_PRICING_REVISION:
        'Báo giá đã được cập nhật ở nơi khác. Vui lòng tải lại dữ liệu.',
      PRICING_ADJUSTMENT_REASON_REQUIRED: `Lý do điều chỉnh giá cần ít nhất ${MIN_REASON_LENGTH} ký tự.`,
      PRICING_SELF_APPROVAL_NOT_ALLOWED:
        'Người đề xuất không thể tự phê duyệt điều chỉnh giá.',
      PRICING_OVERRIDE_EXCEEDS_LIMIT:
        error.message?.trim() || 'Mức điều chỉnh vượt quá giới hạn cho phép.',
      PRICE_BELOW_ALLOWED_MINIMUM:
        'Giá sau điều chỉnh thấp hơn mức giá sàn cho phép.',
      ZERO_PRICE_NOT_ALLOWED: 'Giá báo không được bằng 0.',
      QUOTE_HAS_UNAPPROVED_PRICING: 'Điều chỉnh giá chưa được phê duyệt.',
      QUOTE_NOT_CURRENT: 'Báo giá này không còn là phiên bản hiện hành.',
      CONCURRENT_UPDATE:
        'Dữ liệu vừa được cập nhật. Vui lòng tải lại và thử lại.',
    }
    const known = error.code ? messages[error.code] : undefined
    if (known) return known
    // Show what the server said (which criterion is missing, which amount is invalid) instead of a generic sentence.
    const detail = error.message?.trim()
    if (error.code === 'ORDER_REVIEW_INCOMPLETE')
      return `Đơn chưa đủ điều kiện duyệt${detail ? `: ${detail}` : '.'}`
    if (error.code === 'QUOTE_PRICING_INVALID')
      return `Dữ liệu giá không hợp lệ${detail ? `: ${detail}` : '.'}`
    return `Không thể xử lý yêu cầu định giá${
      detail ? `: ${detail}` : ''
    }${error.code ? ` (${error.code})` : ''}. Vui lòng thử lại.`
  }
  return error instanceof Error
    ? error.message
    : 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}

/** System price lines grouped per checklist (with a subtotal each), then the order-level lines. */
function QuoteBreakdown({
  items,
  checklistItems,
}: {
  items: Array<{
    category: string
    description: string
    amount: number
    orderChecklistItemId?: string | null
  }>
  checklistItems: PricingChecklistItem[]
}) {
  const groups = new Map<string, typeof items>()
  const orderLevel: typeof items = []
  for (const item of items) {
    const id = item.orderChecklistItemId
    if (!id) {
      orderLevel.push(item)
      continue
    }
    groups.set(id, [...(groups.get(id) ?? []), item])
  }
  if (items.length === 0) return null
  return (
    <div className="finance-breakdown" aria-label="Chi tiết giá hệ thống">
      {[...groups.entries()].map(([id, lines]) => {
        const name =
          checklistItems.find((entry) => entry.id === id)?.content ?? 'Nội dung'
        const subtotal = lines.reduce((sum, line) => sum + line.amount, 0)
        return (
          <section key={id} className="finance-breakdown-group">
            <header>
              <strong title={name}>{name}</strong>
              <b>{formatVnd(subtotal)}</b>
            </header>
            <ul>
              {lines.map((line, index) => (
                <li key={`${line.category}-${index}`}>
                  <span>{lineLabel(line.description, name)}</span>
                  <span>{formatVnd(line.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      {orderLevel.length > 0 && (
        <section className="finance-breakdown-group">
          <header>
            <strong>Theo đơn hàng</strong>
            <b>
              {formatVnd(
                orderLevel.reduce((sum, line) => sum + line.amount, 0),
              )}
            </b>
          </header>
          <ul>
            {orderLevel.map((line, index) => (
              <li key={`${line.category}-${index}`}>
                <span>{pricingDescription(line.description)}</span>
                <span>{formatVnd(line.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/** Engine descriptions are "<checklist> · <line>"; inside a group the checklist name is already the heading. */
function lineLabel(description: string, checklistName: string) {
  const text = pricingDescription(description)
  const prefix = `${checklistName.length <= 80 ? checklistName : checklistName.slice(0, 77) + '...'} · `
  return text.startsWith(prefix) ? text.slice(prefix.length) : text
}
