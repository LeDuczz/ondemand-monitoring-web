import { useEffect, useMemo, useState } from 'react'

import { ApiError } from '../../shared/api/httpClient'
import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { formatVnd } from '../../shared/lib/formatVnd'
import { financeApi } from './api'
import type { ChecklistReviewStatus, PricingChecklistItem } from './types'
import './finance.css'

const statuses: Array<{
  value: Exclude<ChecklistReviewStatus, 'PENDING'>
  label: string
}> = [
  { value: 'INCLUDED', label: 'Đã gồm trong gói' },
  { value: 'ADDITIONAL', label: 'Tính phí bổ sung' },
  { value: 'DUPLICATE', label: 'Trùng lặp' },
  { value: 'REJECTED', label: 'Từ chối' },
]

type Draft = {
  packagePrice: string
  discountAmount: string
  adjustmentAmount: string
  managerNote: string
  prices: Record<string, string>
}
const emptyDraft: Draft = {
  packagePrice: '0',
  discountAmount: '0',
  adjustmentAmount: '0',
  managerNote: '',
  prices: {},
}

export function ManagerPricingPanel({ orderId }: { orderId: string }) {
  const query = useApiQuery(
    (signal) => financeApi.getPricingReview(orderId, signal),
    [orderId],
  )
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const quote = query.data?.currentQuote
    if (!query.data) return
    if (!quote) {
      setDraft((state) => ({
        ...state,
        packagePrice: String(query.data!.basePackagePrice),
      }))
      return
    }
    setDraft({
      packagePrice: String(quote.packagePrice),
      discountAmount: String(quote.discountAmount),
      adjustmentAmount: String(quote.adjustmentAmount),
      managerNote: quote.managerNote ?? '',
      prices: Object.fromEntries(
        quote.items
          .filter(
            (item) => item.type === 'ADDITIONAL' && item.orderChecklistItemId,
          )
          .map((item) => [item.orderChecklistItemId!, String(item.unitPrice)]),
      ),
    })
  }, [query.data?.basePackagePrice, query.data?.currentQuote?.id])

  const additional = useMemo(
    () =>
      (query.data?.checklistItems ?? [])
        .filter((item) => item.reviewStatus === 'ADDITIONAL')
        .reduce((sum, item) => sum + amount(draft.prices[item.id]), 0),
    [draft.prices, query.data?.checklistItems],
  )
  const pendingReviewCount = (query.data?.checklistItems ?? []).filter(
    (item) => !item.reviewStatus || item.reviewStatus === 'PENDING',
  ).length
  const checklistCount = query.data?.checklistItems.length ?? 0
  const reviewedCount = checklistCount - pendingReviewCount
  const reviewComplete = pendingReviewCount === 0
  const total =
    amount(draft.packagePrice) +
    additional -
    amount(draft.discountAmount) +
    amount(draft.adjustmentAmount)

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
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function saveDraft() {
    if (!query.data) return null
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const quote = await financeApi.saveDraft(orderId, {
        packagePrice: amount(draft.packagePrice),
        discountAmount: amount(draft.discountAmount),
        adjustmentAmount: amount(draft.adjustmentAmount),
        managerNote: draft.managerNote.trim() || null,
        additionalUnitPrices: Object.fromEntries(
          query.data.checklistItems
            .filter((item) => item.reviewStatus === 'ADDITIONAL')
            .map((item) => [item.id, amount(draft.prices[item.id])]),
        ),
      })
      setMessage('Đã lưu báo giá nháp.')
      query.reload()
      return quote
    } catch (cause) {
      setError(errorMessage(cause))
      return null
    } finally {
      setBusy(false)
    }
  }

  async function approve() {
    if (!reviewComplete) {
      setMessage(null)
      setError(
        `Còn ${pendingReviewCount} nội dung chưa được phân loại. Hãy review toàn bộ checklist trước khi duyệt báo giá.`,
      )
      return
    }
    const quote =
      query.data?.currentQuote?.status === 'DRAFT'
        ? query.data.currentQuote
        : await saveDraft()
    if (!quote) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await financeApi.approveQuote(orderId, quote.id)
      setMessage('Báo giá đã được duyệt và sẵn sàng để khách hàng chấp nhận.')
      query.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  if (query.loading && !query.data)
    return (
      <section className="odm-or-card finance-panel">
        Đang tải thông tin giá...
      </section>
    )
  if (!query.data)
    return (
      <section className="odm-or-card finance-panel finance-error">
        {errorMessage(query.error)}
      </section>
    )
  const approved = query.data.currentQuote?.status === 'APPROVED'
  const accepted = query.data.currentQuote?.status === 'ACCEPTED_BY_CUSTOMER'

  return (
    <section
      className="odm-or-card finance-panel"
      aria-labelledby="manager-pricing-title"
    >
      <header className="finance-heading">
        <div>
          <h2 id="manager-pricing-title">Review yêu cầu và báo giá</h2>
          <p>Mỗi yêu cầu phải được phân loại trước khi duyệt báo giá.</p>
        </div>
        {query.data.currentQuote ? (
          <span
            className={`finance-status is-${query.data.currentQuote.status.toLowerCase()}`}
          >
            v{query.data.currentQuote.version} ·{' '}
            {query.data.currentQuote.status}
          </span>
        ) : null}
      </header>
      <div
        className={`finance-review-progress ${reviewComplete ? 'is-complete' : 'is-pending'}`}
        role="status"
      >
        <strong>
          {reviewedCount}/{checklistCount} nội dung đã review
        </strong>
        <span>
          {reviewComplete
            ? 'Checklist đã hoàn tất và có thể duyệt báo giá.'
            : `Còn ${pendingReviewCount} nội dung cần chọn cách tính giá trước khi duyệt.`}
        </span>
      </div>
      <div className="finance-checklist">
        {query.data.checklistItems.map((item) => (
          <div className="finance-requirement" key={item.id}>
            <div className="finance-requirement-main">
              <strong>{item.content}</strong>
              <span>
                {item.sourceType === 'SERVICE_TEMPLATE'
                  ? 'Yêu cầu mặc định của gói'
                  : 'Yêu cầu thêm của khách hàng'}
              </span>
            </div>
            <label>
              <span>Phân loại</span>
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
                  Chưa review
                </option>
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            {item.reviewStatus === 'ADDITIONAL' ? (
              <label>
                <span>Đơn giá thêm (VND)</span>
                <input
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={draft.prices[item.id] ?? '0'}
                  disabled={accepted}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      prices: {
                        ...value.prices,
                        [item.id]: digits(event.target.value),
                      },
                    }))
                  }
                />
              </label>
            ) : (
              <div className="finance-zero">Phụ phí: {formatVnd(0)}</div>
            )}
            <label className="finance-note">
              <span>Ghi chú manager</span>
              <input
                defaultValue={item.managerNote ?? ''}
                disabled={accepted || item.reviewStatus === 'PENDING'}
                placeholder={
                  item.reviewStatus === 'PENDING'
                    ? 'Phân loại nội dung trước'
                    : 'Lý do hoặc phạm vi xử lý'
                }
                onBlur={(event) =>
                  void updateReview(item, item.reviewStatus, event.target.value)
                }
              />
            </label>
          </div>
        ))}
      </div>
      <div className="finance-pricing-grid">
        <div className="finance-inputs">
          <MoneyInput
            label="Giá gói"
            value={draft.packagePrice}
            onChange={(value) =>
              setDraft((state) => ({ ...state, packagePrice: value }))
            }
            disabled={accepted}
          />
          <MoneyInput
            label="Giảm giá"
            value={draft.discountAmount}
            onChange={(value) =>
              setDraft((state) => ({ ...state, discountAmount: value }))
            }
            disabled={accepted}
          />
          <MoneyInput
            label="Điều chỉnh (+/-)"
            value={draft.adjustmentAmount}
            onChange={(value) =>
              setDraft((state) => ({
                ...state,
                adjustmentAmount: signedDigits(value),
              }))
            }
            disabled={accepted}
          />
          <label>
            <span>Ghi chú báo giá</span>
            <textarea
              rows={3}
              value={draft.managerNote}
              disabled={accepted}
              onChange={(event) =>
                setDraft((state) => ({
                  ...state,
                  managerNote: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <dl className="finance-summary">
          <Row label="Giá gói" value={amount(draft.packagePrice)} />
          <Row label="Chi phí bổ sung" value={additional} />
          <Row label="Giảm giá" value={-amount(draft.discountAmount)} />
          <Row label="Điều chỉnh" value={amount(draft.adjustmentAmount)} />
          <Row label="Tổng báo giá" value={total} total />
        </dl>
      </div>
      {error ? (
        <p className="finance-alert is-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="finance-alert is-success" role="status">
          {message}
        </p>
      ) : null}
      {!accepted ? (
        <div className="finance-actions">
          <button
            className="odm-btn"
            type="button"
            disabled={busy}
            onClick={() => void saveDraft()}
          >
            Lưu nháp
          </button>
          <button
            className="odm-btn odm-btn-p"
            type="button"
            disabled={busy || approved || !reviewComplete}
            title={
              !reviewComplete
                ? 'Review toàn bộ checklist trước khi duyệt báo giá'
                : undefined
            }
            onClick={() => void approve()}
          >
            {approved ? 'Đã duyệt báo giá' : 'Duyệt báo giá'}
          </button>
        </div>
      ) : null}
    </section>
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
}: {
  label: string
  value: number
  total?: boolean
}) {
  return (
    <div className={total ? 'is-total' : ''}>
      <dt>{label}</dt>
      <dd>{formatVnd(value)}</dd>
    </div>
  )
}
function amount(value: string | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isSafeInteger(parsed) ? parsed : 0
}
function digits(value: string) {
  return value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '') || '0'
}
function signedDigits(value: string) {
  return `${value.startsWith('-') ? '-' : ''}${digits(value)}`
}
function errorMessage(error: unknown) {
  if (
    error instanceof ApiError &&
    error.code === 'ORDER_CHECKLIST_REVIEW_INVALID'
  ) {
    return 'Checklist chưa được review đầy đủ. Hãy phân loại tất cả nội dung trước khi duyệt báo giá.'
  }
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}
