import { useState } from 'react'

import { ApiError } from '../../../../shared/api/httpClient'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import { readinessApi } from '../../api/readinessApi'
import { ordersApi } from '../../api/ordersApi'
import type {
  CriterionResult,
  OrderReadiness,
  ReadinessCriterion,
  ReadinessRecommendation,
} from '../../types/readiness'
import { OrderIcon } from './OrderIcon'
import './OrderReadinessCard.css'

type Answer = Exclude<CriterionResult, 'PENDING'>
type FailureAction = 'NEED_INFO' | 'REJECTED'

const resultLabel: Record<CriterionResult, string> = {
  PASS: 'Đạt',
  WARN: 'Cần xem xét',
  FAIL: 'Không đạt',
  PENDING: 'Chưa xét',
}

const recommendationText: Record<ReadinessRecommendation, string> = {
  COMPLETE_REVIEW: 'Hoàn tất các mục manager cần xác nhận',
  REQUEST_INFO_OR_REJECT:
    'Có tiêu chí bắt buộc không đạt: yêu cầu bổ sung hoặc từ chối',
  APPROVE_WITH_NOTES: 'Có thể duyệt, nhưng cần liên hệ xác minh',
  APPROVE: 'Đủ điều kiện duyệt',
}

const answerOptions: Answer[] = ['PASS', 'FAIL']
const riskLevelOptions: Answer[] = ['PASS', 'WARN', 'FAIL']

const contextualAnswerLabels: Record<string, Record<Answer, string>> = {
  RISK_LEVEL: {
    PASS: 'Thấp',
    WARN: 'Trung bình',
    FAIL: 'Cao',
  },
  SITE_ACCESS: {
    PASS: 'Đã liên hệ, đồng ý',
    WARN: 'Đã liên hệ, đồng ý',
    FAIL: 'Chưa liên hệ được / không đồng ý',
  },
}

const failNotePlaceholders: Record<string, string> = {
  SITE_ACCESS:
    'Lý do (bắt buộc): vd. đã gọi nhiều lần không liên lạc được, hoặc chủ đất từ chối',
}

const criterionDescriptionOverrides: Record<string, string> = {}
const criterionTitleOverrides: Record<string, string> = {}

/**
 * Approval criteria for an order. Left: what the system checked on its own.
 * Right: what only the manager can judge. The backend enforces the same rules
 * when the quote is approved; this card makes them visible.
 */
export function OrderReadinessCard({
  orderId,
  query,
  editable,
  onDecisionDone,
}: {
  orderId: string
  query: UseApiQueryState<OrderReadiness>
  editable: boolean
  onDecisionDone?: () => void
}) {
  const [drafts, setDrafts] = useState<
    Record<string, { result: Answer; note: string }>
  >({})
  const [savingCode, setSavingCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedResults, setSelectedResults] = useState<
    Record<string, Answer>
  >({})

  const readiness = query.data
  if (!readiness) {
    return (
      <section
        className="odm-or-card odm-or-readiness"
        aria-label="Điều kiện duyệt"
      >
        <header className="odm-or-card-head">
          <span className="odm-or-card-title">
            <OrderIcon name="check" size={18} />
            Điều kiện duyệt
          </span>
        </header>
        <div className="odm-or-card-body odm-or-empty">
          {query.loading
            ? 'Đang kiểm tra điều kiện duyệt...'
            : 'Không tải được điều kiện duyệt.'}
        </div>
      </section>
    )
  }

  const auto = readiness.criteria.filter(
    (c) =>
      c.type === 'AUTO' &&
      c.code !== 'CHECKLIST_REVIEWED' &&
      c.code !== 'SCHEDULE_DATE',
  )
  const manual = readiness.criteria.filter(
    (c) =>
      c.type === 'MANUAL' &&
      c.code !== 'SURVEY_NEEDED' &&
      c.code !== 'AIRSPACE_PERMIT',
  )
  const pendingRequired = manual.filter(
    (c) => c.required && c.result === 'PENDING',
  ).length
  const autoPassed = auto.filter((c) => c.result === 'PASS').length
  const manualAnswered = manual.filter((c) => c.result !== 'PENDING').length

  async function save(code: string, result: Answer, note: string) {
    const previousResult = selectedResults[code]
    setSelectedResults((state) => ({ ...state, [code]: result }))
    setSavingCode(code)
    setError(null)
    try {
      await readinessApi.answer(orderId, code, {
        result,
        note: note.trim() || null,
      })
      setDrafts((state) => {
        const next = { ...state }
        delete next[code]
        return next
      })
      query.reload()
    } catch (cause) {
      setSelectedResults((state) => {
        const next = { ...state }
        if (previousResult) next[code] = previousResult
        else delete next[code]
        return next
      })
      setError(
        cause instanceof ApiError || cause instanceof Error
          ? cause.message
          : 'Không lưu được. Vui lòng thử lại.',
      )
    } finally {
      setSavingCode(null)
    }
  }

  const failedRequired = manual.filter((criterion) => {
    const effectiveResult =
      drafts[criterion.code]?.result ??
      selectedResults[criterion.code] ??
      criterion.result
    return criterion.required && effectiveResult === 'FAIL'
  })
  const failedReasonsComplete = failedRequired.every((criterion) =>
    Boolean(
      drafts[criterion.code]?.note.trim() || criterion.note?.trim(),
    ),
  )

  async function submitFailedDecision(decision: FailureAction) {
    if (!failedReasonsComplete) {
      setError('Vui lòng nhập lý do cho tất cả tiêu chí không đạt trước khi tiếp tục.')
      return
    }
    const reason = failedRequired
      .map((criterion) => {
        const note =
          drafts[criterion.code]?.note.trim() || criterion.note?.trim()
        return note ? `${criterion.title}: ${note}` : criterion.title
      })
      .join('; ')
    if (!reason) return
    setSavingCode('decision')
    setError(null)
    try {
      await Promise.all(
        failedRequired
          .filter((criterion) => drafts[criterion.code]?.result === 'FAIL')
          .map((criterion) =>
            readinessApi.answer(orderId, criterion.code, {
              result: 'FAIL',
              note: drafts[criterion.code].note.trim(),
            }),
          ),
      )
      await ordersApi.submitApproval(orderId, { decision, reason })
      onDecisionDone?.()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không gửi được quyết định.')
      setSavingCode(null)
    }
  }

  function choose(criterion: ReadinessCriterion, result: Answer) {
    const note = drafts[criterion.code]?.note ?? criterion.note ?? ''
    if (result === 'FAIL') {
      // A failing answer needs a reason first.
      setDrafts((state) => ({ ...state, [criterion.code]: { result, note } }))
      return
    }
    void save(criterion.code, result, note)
  }

  return (
    <section
      className="odm-or-card odm-or-readiness"
      aria-label="Điều kiện duyệt"
    >
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="check" size={18} />
          Điều kiện duyệt
        </span>
        <div className="odm-or-readiness-head-actions">
          <span
            className={`odm-or-readiness-verdict is-${readiness.canApprove ? 'ok' : 'blocked'}`}
            role="status"
          >
            {readiness.canApprove
              ? recommendationText[readiness.recommendation]
              : pendingRequired > 0
                ? `Còn ${pendingRequired} mục manager cần xác nhận`
                : recommendationText[readiness.recommendation]}
          </span>
        </div>
      </header>
      <div className="odm-or-readiness-body">
        <div className="odm-or-readiness-col">
          <h3>
            Hệ thống kiểm tra
            <span className="odm-or-readiness-count">
              {autoPassed}/{auto.length} đạt
            </span>
          </h3>
          <ul className="odm-or-readiness-list">
            {auto.map((c) => (
              <li key={c.code} className={`is-${c.result.toLowerCase()}`}>
                <span className="odm-or-readiness-dot" aria-hidden="true" />
                <div>
                  <strong>
                    {c.title}
                    {c.required ? (
                      <>
                        <span className="odm-or-readiness-tag">Bắt buộc</span>
                      </>
                    ) : null}
                  </strong>
                  <span>{c.reason ?? c.description}</span>
                </div>
                <em>{resultLabel[c.result]}</em>
              </li>
            ))}
          </ul>
        </div>
        <div className="odm-or-readiness-col">
          <h3>
            Manager xác nhận
            <span className="odm-or-readiness-count">
              {manualAnswered}/{manual.length} đã xác nhận
            </span>
          </h3>
          <ul className="odm-or-readiness-list">
            {manual.map((c) => {
              const options =
                c.code === 'RISK_LEVEL' ? riskLevelOptions : answerOptions
              const draft = drafts[c.code]
              const current =
                draft?.result ??
                selectedResults[c.code] ??
                (c.result === 'PENDING' ? null : c.result)
              const note = draft?.note ?? c.note ?? ''
              const needsNote = draft?.result === 'FAIL'
              return (
                <li
                  key={c.code}
                  className={`is-${(current ?? 'pending').toLowerCase()}`}
                >
                  <span className="odm-or-readiness-dot" aria-hidden="true" />
                  <div>
                    <strong>
                      {criterionTitleOverrides[c.code] ?? c.title}
                      {c.required ? (
                        <span className="odm-or-readiness-tag">Bắt buộc</span>
                      ) : null}
                    </strong>
                    <span>
                      {criterionDescriptionOverrides[c.code] ?? c.description}
                    </span>
                    {c.decidedByName && !draft ? (
                      <span className="odm-or-readiness-meta">
                        Người xác nhận: {c.decidedByName}
                      </span>
                    ) : null}
                    {needsNote || (c.note && !draft) || draft ? (
                      <input
                        className="odm-or-readiness-note"
                        value={note}
                        disabled={!editable}
                        placeholder={
                          needsNote
                            ? (failNotePlaceholders[c.code] ??
                              'Lý do không đạt (bắt buộc)')
                            : 'Ghi chú'
                        }
                        aria-label={`Ghi chú: ${criterionTitleOverrides[c.code] ?? c.title}`}
                        onChange={(event) =>
                          setDrafts((state) => ({
                            ...state,
                            [c.code]: {
                              result: (state[c.code]?.result ??
                                (c.result === 'PENDING'
                                  ? 'PASS'
                                  : c.result)) as Answer,
                              note: event.target.value,
                            },
                          }))
                        }
                      />
                    ) : null}
                    {draft ? (
                      <button
                        type="button"
                        className="odm-btn odm-btn-sm"
                        disabled={
                          savingCode === c.code ||
                          (draft.result === 'FAIL' && !draft.note.trim())
                        }
                        onClick={() =>
                          void save(c.code, draft.result, draft.note)
                        }
                      >
                        Lưu
                      </button>
                    ) : null}
                  </div>
                  <div
                    className="odm-or-readiness-choices"
                    role="group"
                    aria-label={criterionTitleOverrides[c.code] ?? c.title}
                  >
                    {options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`is-${option.toLowerCase()}${current === option ? ' is-on' : ''}`}
                        aria-pressed={current === option}
                        aria-busy={savingCode === c.code && current === option}
                        disabled={!editable || savingCode === c.code}
                        onClick={() => choose(c, option)}
                      >
                        {savingCode === c.code && current === option
                          ? 'Đang lưu…'
                          : (contextualAnswerLabels[c.code]?.[option] ??
                            resultLabel[option])}
                      </button>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      {error ? (
        <p className="odm-or-readiness-error" role="alert">
          {error}
        </p>
      ) : null}
      {!readiness.canApprove && readiness.blockingReasons.length > 0 ? (
        <div className="odm-or-readiness-blocking" aria-label="Lý do chưa thể duyệt">
          <ul>
            {readiness.blockingReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {failedRequired.length > 0 && editable ? (
            <div className="odm-or-readiness-blocking-actions">
              <button
                type="button"
                className="odm-btn odm-btn-ok"
                disabled={savingCode === 'decision'}
                onClick={() => void submitFailedDecision('NEED_INFO')}
              >
                Yêu cầu bổ sung
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-rd"
                disabled={savingCode === 'decision'}
                onClick={() => void submitFailedDecision('REJECTED')}
              >
                Từ chối đơn
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
