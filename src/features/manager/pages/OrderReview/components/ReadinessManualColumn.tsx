import {
  riskLevelOptions,
  answerOptions,
  criterionDescriptionOverrides,
  type Answer,
  contextualAnswerLabels,
  resultLabel,
} from '../readinessLabels'
import type { ReadinessCriterion } from '../../../types/readiness'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { readinessManualColumnMessages } from './ReadinessManualColumn.messages'

export function ReadinessManualColumn({
  manualAnswered,
  manual,
  drafts,
  selectedResults,
  editable,
  setDrafts,
  savingCode,
  save,
  choose,
}: {
  manualAnswered: number
  manual: ReadinessCriterion[]
  drafts: Record<string, { result: Answer; note: string }>
  selectedResults: Record<string, Answer>
  editable: boolean
  setDrafts: Dispatch<
    SetStateAction<Record<string, { result: Answer; note: string }>>
  >
  savingCode: string | null
  save: (code: string, result: Answer, note: string) => Promise<void>
  choose: (criterion: ReadinessCriterion, result: Answer) => void
}) {
  const { t } = useI18n(readinessManualColumnMessages)

  return (
    <div className="odm-or-readiness-col">
      <h3>
        {t.managerConfirms}
        <span className="odm-or-readiness-count">
          {manualAnswered}/{manual.length}
          {t.confirmed}
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
                  {c.title}
                  {c.required ? (
                    <span className="odm-or-readiness-tag">{t.required}</span>
                  ) : null}
                </strong>
                <span>
                  {criterionDescriptionOverrides[c.code] ?? c.description}
                </span>
                {c.decidedByName && !draft ? (
                  <span className="odm-or-readiness-meta">
                    {t.confirmedBy}
                    {c.decidedByName}
                  </span>
                ) : null}
                {needsNote || (c.note && !draft) || draft ? (
                  <input
                    className="odm-or-readiness-note"
                    value={note}
                    disabled={!editable}
                    placeholder={needsNote ? t.failureReasonRequired : t.note}
                    aria-label={t.ghiChu2(c.title)}
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
                    onClick={() => void save(c.code, draft.result, draft.note)}
                  >
                    {t.save}
                  </button>
                ) : null}
              </div>
              <div
                className="odm-or-readiness-choices"
                role="group"
                aria-label={c.title}
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
                      ? t.saving
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
  )
}
