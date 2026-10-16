import { useEffect, useState, type ReactNode } from 'react'

import { ApiError } from '../../shared/api/httpClient'
import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { formatVnd } from '../../shared/lib/formatVnd'
import {
  pricingDescription,
  pricingLabel,
} from '../../shared/lib/pricingPresentation'
import { financeApi } from './api'
import type { ChecklistReviewStatus, PricingChecklistItem } from './types'
import type { CustomWorkAssessment } from './types'
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
}
const emptyDraft: Draft = {
  packagePrice: '0',
  discountAmount: '0',
  adjustmentAmount: '0',
  managerNote: '',
  adjustmentReason: '',
  adjustmentType: 'CORRECTION',
  approvalNote: '',
}
const emptyAssessment: CustomWorkAssessment = {
  estimatedFlightHours: null,
  estimatedDistanceKm: null,
  estimatedAreaHa: null,
  pilotCount: 1,
  droneCount: 1,
  batteryUnits: 0,
  terrain: 'FLAT',
  thermalRequired: false,
  multispectralRequired: false,
  aiReportRequired: false,
  nightOperation: false,
  specialEquipment: null,
  otherCostDrivers: null,
  assessmentComplete: false,
}

export function ManagerPricingPanel({
  orderId,
  decisionActions,
  onApproved,
  onChecklistReviewChanged,
  approveBlockedReason,
}: {
  orderId: string
  decisionActions?: ReactNode
  onApproved?: () => void
  onChecklistReviewChanged?: () => void
  /** Why approving is not allowed yet (approval criteria not met); null/undefined = allowed. */
  approveBlockedReason?: string | null
}) {
  const query = useApiQuery(
    (signal) => financeApi.getPricingReview(orderId, signal),
    [orderId],
  )
  const assessmentQuery = useApiQuery(
    (signal) => financeApi.getAssessment(orderId, signal),
    [orderId],
  )
  const [assessment, setAssessment] =
    useState<CustomWorkAssessment>(emptyAssessment)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'reviewed' | 'additional'
  >('all')
  const [openNote, setOpenNote] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [approvalSucceeded, setApprovalSucceeded] = useState(false)

  useEffect(() => {
    setApprovalSucceeded(false)
  }, [orderId])

  useEffect(() => {
    setAssessment(assessmentQuery.data ?? emptyAssessment)
  }, [assessmentQuery.data])

  useEffect(() => {
    const quote = query.data?.currentQuote
    if (!query.data) return
    if (!quote) {
      setDraft((state) => ({
        ...state,
        packagePrice: String(
          query.data!.systemCalculation?.systemCalculatedAmount ??
            query.data!.basePackagePrice,
        ),
      }))
      return
    }
    setDraft({
      packagePrice: String(quote.packagePrice),
      discountAmount: String(quote.discountAmount),
      adjustmentAmount: String(quote.adjustmentAmount),
      managerNote: quote.managerNote ?? '',
      adjustmentReason: quote.adjustmentReason ?? '',
      adjustmentType: quote.adjustmentType ?? 'CORRECTION',
      approvalNote: '',
    })
  }, [query.data])

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
  const total = systemPrice + amount(draft.adjustmentAmount)

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

  async function saveAssessment() {
    setBusy(true)
    setError(null)
    try {
      await financeApi.saveAssessment(orderId, {
        ...assessment,
        assessmentComplete: true,
      })
      setMessage(
        'Đã lưu đánh giá công việc tùy chỉnh và tính lại giá hệ thống.',
      )
      assessmentQuery.reload()
      query.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function saveDraft() {
    if (!query.data) return null
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const quote = await financeApi.saveDraft(orderId, {
        packagePrice: systemPrice,
        discountAmount: 0,
        adjustmentAmount: amount(draft.adjustmentAmount),
        managerNote: draft.managerNote.trim() || null,
        additionalUnitPrices: {},
        adjustmentReason: draft.adjustmentReason.trim() || null,
        adjustmentType: draft.adjustmentType,
        expectedPricingRevision:
          query.data.currentQuote?.pricingRevision ?? null,
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
    if (!query.data) return
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
        additionalUnitPrices: {},
        adjustmentReason: draft.adjustmentReason.trim() || null,
        adjustmentType: draft.adjustmentType,
        expectedPricingRevision:
          query.data.currentQuote?.pricingRevision ?? null,
      })
      if (amount(draft.adjustmentAmount) !== 0) {
        setMessage('Đã gửi điều chỉnh giá cho quản lý khác phê duyệt.')
        query.reload()
        return
      }
      await financeApi.approveQuote(orderId, quote.id)
      setApprovalSucceeded(true)
      onApproved?.()
      setMessage(
        'Duyệt báo giá thành công. Báo giá đã sẵn sàng để khách hàng chấp nhận.',
      )
      query.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function decidePricing(approvedDecision: boolean) {
    const quote = query.data?.currentQuote
    if (!quote?.pricingRevision) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await financeApi.decidePricing(
        orderId,
        quote.id,
        quote.pricingRevision,
        approvedDecision,
        draft.approvalNote.trim() || null,
      )
      setMessage(
        approvedDecision
          ? 'Đã phê duyệt điều chỉnh giá.'
          : 'Đã từ chối điều chỉnh giá.',
      )
      if (approvedDecision) onApproved?.()
      query.reload()
    } catch (cause) {
      setError(errorMessage(cause))
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
              {decisionActions}
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
              {decisionActions}
            </div>
          </aside>
        </div>
      </div>
    )
  const approved =
    approvalSucceeded || query.data.currentQuote?.status === 'APPROVED'
  const accepted = query.data.currentQuote?.status === 'ACCEPTED_BY_CUSTOMER'
  const pendingSecondManager =
    query.data.currentQuote?.pricingApprovalStatus === 'PENDING_SECOND_MANAGER'
  const canDecidePricing =
    pendingSecondManager &&
    query.data.currentQuote?.adjustmentRequestedById !==
      query.data.currentManagerId
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
        {query.data.systemCalculation?.customWork ? (
          <section className="finance-custom-assessment">
            <h3>Đánh giá công việc tùy chỉnh</h3>
            <p>Nhập các yếu tố chi phí; hệ thống sẽ tự động tính giá cơ sở.</p>
            <div className="finance-assessment-grid">
              <AssessmentNumber
                label="Quãng đường (km)"
                value={assessment.estimatedDistanceKm}
                onChange={(value) =>
                  setAssessment({ ...assessment, estimatedDistanceKm: value })
                }
              />
              <AssessmentNumber
                label="Diện tích (ha)"
                value={assessment.estimatedAreaHa}
                onChange={(value) =>
                  setAssessment({ ...assessment, estimatedAreaHa: value })
                }
              />
              <AssessmentNumber
                label="Giờ bay"
                value={assessment.estimatedFlightHours}
                onChange={(value) =>
                  setAssessment({ ...assessment, estimatedFlightHours: value })
                }
              />
              <AssessmentNumber
                label="Số nhân sự điều khiển"
                value={assessment.pilotCount}
                onChange={(value) =>
                  setAssessment({ ...assessment, pilotCount: value })
                }
              />
              <AssessmentNumber
                label="Số thiết bị bay"
                value={assessment.droneCount}
                onChange={(value) =>
                  setAssessment({ ...assessment, droneCount: value })
                }
              />
              <AssessmentNumber
                label="Số bộ pin"
                value={assessment.batteryUnits}
                onChange={(value) =>
                  setAssessment({ ...assessment, batteryUnits: value })
                }
              />
              <label>
                <span>Địa hình</span>
                <select
                  value={assessment.terrain}
                  onChange={(e) =>
                    setAssessment({
                      ...assessment,
                      terrain: e.target
                        .value as CustomWorkAssessment['terrain'],
                    })
                  }
                >
                  <option value="FLAT">Bằng phẳng</option>
                  <option value="MOUNTAIN">Đồi núi</option>
                  <option value="HIGH_RISE">Nhà cao tầng</option>
                  <option value="DAM_RESERVOIR">Đập/hồ chứa</option>
                  <option value="HARD_TO_ACCESS">Khó tiếp cận</option>
                </select>
              </label>
            </div>
            <div className="finance-assessment-checks">
              {(
                [
                  ['thermalRequired', 'Ảnh nhiệt'],
                  ['multispectralRequired', 'Ảnh đa phổ'],
                  ['aiReportRequired', 'Báo cáo phân tích AI'],
                  ['nightOperation', 'Bay đêm'],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={assessment[key]}
                    onChange={(e) =>
                      setAssessment({ ...assessment, [key]: e.target.checked })
                    }
                  />{' '}
                  {label}
                </label>
              ))}
            </div>
            <button
              className="odm-btn"
              type="button"
              disabled={busy}
              onClick={() => void saveAssessment()}
            >
              Lưu đánh giá và tính lại
            </button>
          </section>
        ) : null}
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
              <div className="finance-zero">
                {item.sourceType === 'SERVICE_TEMPLATE'
                  ? 'Hệ thống tính giá · Không cần Manager review'
                  : `${pricingLabel(item.difficultySnapshot ?? 'BASIC')} · hệ thống tính giá`}
              </div>
              <span
                className={`finance-review-badge is-${item.reviewStatus.toLowerCase()}`}
              >
                {item.sourceType === 'SERVICE_TEMPLATE'
                  ? 'Tự động tính giá'
                  : item.reviewStatus === 'PENDING'
                    ? 'Chưa xem xét'
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
          <header className="finance-heading">
            <h2>Tóm tắt báo giá</h2>
          </header>
          <div className="finance-quote-body">
            <div className="finance-quote-content">
              <div className="finance-system-breakdown">
                <strong>
                  GIÁ HỆ THỐNG · Chính sách phiên bản
                  {query.data.systemCalculation?.policyVersion ??
                    query.data.currentQuote?.pricingPolicyVersion ??
                    '—'}
                </strong>
                {(query.data.systemCalculation?.items ?? []).map(
                  (item, index) => (
                    <div key={`${item.category}-${index}`}>
                      <span>{pricingDescription(item.description)}</span>
                      <b>{formatVnd(item.amount)}</b>
                    </div>
                  ),
                )}
              </div>
              <dl className="finance-summary">
                <Row label="Giá hệ thống" value={systemPrice} />
                <Row
                  label="Điều chỉnh"
                  value={amount(draft.adjustmentAmount)}
                />
                <Row label="Tổng báo giá" value={total} total />
              </dl>
              {!reviewComplete && (
                <p className="finance-block-hint">
                  Còn {pendingReviewCount} nội dung cần xem xét trước khi duyệt.
                </p>
              )}
              <details className="finance-adjustments">
                <summary>Điều chỉnh báo giá</summary>
                <div className="finance-pricing-grid">
                  <div className="finance-inputs">
                    <label>
                      <span>Loại điều chỉnh</span>
                      <select
                        value={draft.adjustmentType}
                        disabled={accepted || pendingSecondManager}
                        onChange={(event) =>
                          setDraft((state) => ({
                            ...state,
                            adjustmentType: event.target
                              .value as Draft['adjustmentType'],
                          }))
                        }
                      >
                        <option value="DISCOUNT">Giảm giá</option>
                        <option value="CORRECTION">Hiệu chỉnh</option>
                        <option value="PROMOTION">Khuyến mãi</option>
                        <option value="COMPENSATION">Bồi hoàn</option>
                        <option value="GOODWILL">Thiện chí</option>
                      </select>
                    </label>
                    <MoneyInput
                      label="Điều chỉnh (+/-)"
                      value={draft.adjustmentAmount}
                      onChange={(value) =>
                        setDraft((state) => ({
                          ...state,
                          adjustmentAmount: signedDigits(value),
                        }))
                      }
                      disabled={accepted || pendingSecondManager}
                    />
                    <label className="finance-quote-note">
                      <span>Lý do điều chỉnh (bắt buộc khi khác 0)</span>
                      <textarea
                        rows={3}
                        value={draft.adjustmentReason}
                        disabled={accepted || pendingSecondManager}
                        onChange={(event) =>
                          setDraft((state) => ({
                            ...state,
                            adjustmentReason: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </div>
              </details>
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
              {canDecidePricing ? (
                <div className="finance-adjustment-review">
                  <p>
                    <b>{query.data.currentQuote?.adjustmentRequestedByName}</b>{' '}
                    đề xuất{' '}
                    {formatVnd(
                      query.data.currentQuote?.managerAdjustmentAmount ?? 0,
                    )}
                  </p>
                  <p>{query.data.currentQuote?.adjustmentReason}</p>
                  {(query.data.currentQuote?.riskFlags ?? []).map((flag) => (
                    <span className="finance-risk" key={flag}>
                      {pricingLabel(flag)}
                    </span>
                  ))}
                  <textarea
                    aria-label="Ghi chú phê duyệt"
                    value={draft.approvalNote}
                    onChange={(event) =>
                      setDraft((state) => ({
                        ...state,
                        approvalNote: event.target.value,
                      }))
                    }
                  />
                  <div className="finance-actions">
                    <button
                      className="odm-btn"
                      disabled={busy}
                      onClick={() => void decidePricing(false)}
                    >
                      Từ chối
                    </button>
                    <button
                      className="odm-btn odm-btn-p"
                      disabled={busy}
                      onClick={() => void decidePricing(true)}
                    >
                      Phê duyệt điều chỉnh
                    </button>
                  </div>
                </div>
              ) : !accepted ? (
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
                    id="manager-approve-quote"
                    className="odm-btn odm-btn-p"
                    type="button"
                    disabled={
                      busy ||
                      approved ||
                      pendingSecondManager ||
                      pendingCustomCount > 0 ||
                      Boolean(approveBlockedReason)
                    }
                    title={
                      pendingCustomCount > 0
                        ? 'Phân loại các yêu cầu bổ sung trước khi duyệt báo giá'
                        : (approveBlockedReason ?? undefined)
                    }
                    onClick={() => void approve()}
                  >
                    {pendingSecondManager
                      ? 'Đang chờ quản lý khác phê duyệt'
                      : approved
                        ? 'Đã duyệt thành công'
                        : amount(draft.adjustmentAmount) !== 0
                          ? 'Gửi phê duyệt điều chỉnh'
                          : 'Duyệt báo giá'}
                  </button>
                </div>
              ) : null}
            </div>
            {decisionActions}
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
function AssessmentNumber({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        min="0"
        value={value ?? ''}
        onChange={(event) =>
          onChange(
            event.target.value === '' ? null : Number(event.target.value),
          )
        }
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
  if (error instanceof ApiError) {
    if (error.code === 'CUSTOM_WORK_PRICING_INCOMPLETE') return error.message
    const messages: Record<string, string> = {
      ORDER_CHECKLIST_REVIEW_INVALID:
        'Danh sách yêu cầu chưa được xem xét đầy đủ. Hãy phân loại tất cả nội dung trước khi duyệt báo giá.',
      STALE_PRICING_REVISION:
        'Báo giá đã được cập nhật ở nơi khác. Vui lòng tải lại dữ liệu.',
      PRICING_ADJUSTMENT_REASON_REQUIRED: 'Vui lòng nhập lý do điều chỉnh giá.',
      PRICING_SELF_APPROVAL_NOT_ALLOWED:
        'Người đề xuất không thể tự phê duyệt điều chỉnh giá.',
      PRICING_OVERRIDE_EXCEEDS_LIMIT:
        'Mức điều chỉnh vượt quá giới hạn cho phép.',
      PRICE_BELOW_ALLOWED_MINIMUM:
        'Giá sau điều chỉnh thấp hơn mức giá sàn cho phép.',
      ZERO_PRICE_NOT_ALLOWED: 'Giá báo không được bằng 0.',
      QUOTE_HAS_UNAPPROVED_PRICING: 'Điều chỉnh giá chưa được phê duyệt.',
      QUOTE_NOT_CURRENT: 'Báo giá này không còn là phiên bản hiện hành.',
      CONCURRENT_UPDATE:
        'Dữ liệu vừa được cập nhật. Vui lòng tải lại và thử lại.',
    }
    return error.code
      ? (messages[error.code] ??
          'Không thể xử lý yêu cầu định giá. Vui lòng thử lại.')
      : 'Không thể xử lý yêu cầu định giá. Vui lòng thử lại.'
  }
  return error instanceof Error
    ? error.message
    : 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}
