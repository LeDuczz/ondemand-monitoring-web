import { useState } from 'react'

import { ApiError } from '../../../../../shared/api/httpClient'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { ordersApi } from '../../../api/ordersApi'
import { readinessApi } from '../../../api/readinessApi'
import type {
  OrderReadiness,
  ReadinessCriterion,
} from '../../../types/readiness'
import './OrderReadinessCard.css'
import { type Answer } from '../readinessLabels'
import { ReadinessUnavailable } from './ReadinessUnavailable'
import { ReadinessHeader } from './ReadinessHeader'
import { ReadinessAutoColumn } from './ReadinessAutoColumn'
import { ReadinessManualColumn } from './ReadinessManualColumn'
import { ReadinessBlockingReasons } from './ReadinessBlockingReasons'
import { useI18n } from '../../../../../shared/i18n'
import { orderReadinessCardMessages } from './OrderReadinessCard.messages'

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
  /** Called after a failed required criterion led to a reject / need-info decision. */
  onDecisionDone?: () => void
}) {
  const { t } = useI18n(orderReadinessCardMessages)

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
    return <ReadinessUnavailable query={query} />
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
          : t.couldNotSavePleaseTry,
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
    Boolean(drafts[criterion.code]?.note.trim() || criterion.note?.trim()),
  )

  async function submitFailedDecision(decision: 'NEED_INFO' | 'REJECTED') {
    if (!failedReasonsComplete) {
      setError(t.failedReasonsRequired)
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
      setError(cause instanceof Error ? cause.message : t.decisionFailed)
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
      aria-label={t.approvalConditions}
    >
      <ReadinessHeader
        readiness={readiness}
        pendingRequired={pendingRequired}
      />
      <div className="odm-or-readiness-body">
        <ReadinessAutoColumn autoPassed={autoPassed} auto={auto} />
        <ReadinessManualColumn
          manualAnswered={manualAnswered}
          manual={manual}
          drafts={drafts}
          selectedResults={selectedResults}
          editable={editable}
          setDrafts={setDrafts}
          savingCode={savingCode}
          save={save}
          choose={choose}
        />
      </div>
      {error ? (
        <p className="odm-or-readiness-error" role="alert">
          {error}
        </p>
      ) : null}
      <ReadinessBlockingReasons
        readiness={readiness}
        canDecide={failedRequired.length > 0 && editable}
        busy={savingCode === 'decision'}
        onDecision={(decision) => void submitFailedDecision(decision)}
      />
    </section>
  )
}
