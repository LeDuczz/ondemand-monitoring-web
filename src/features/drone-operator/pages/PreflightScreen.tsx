import { useState } from 'react'

import { operatorApi } from '../api/operatorApi'
import { preflightSummary } from '../lib/preflightSummary'
import { operatorHref } from '../routes'
import type {
  PreflightItem,
  PreflightItemKey,
  PreflightItemResult,
} from '../types/mission'
import { FlightStepHeader } from './FlightStepper'
import { PREFLIGHT_GROUPS, PreflightItemRow } from './PreflightItem'

const MISSION_ID = 'MSN-2609-0142-1'
const ALL_KEYS = PREFLIGHT_GROUPS.flatMap((g) => g.items.map((i) => i.key))

type ResultsState = Partial<Record<PreflightItemKey, PreflightItemResult>>
type NotesState = Partial<Record<PreflightItemKey, string>>

/** OPR-06W — Preflight checklist: 9 mục chia 3 nhóm, summary PASS/FAIL/đang kiểm. */
export function PreflightScreen() {
  const [results, setResults] = useState<ResultsState>({})
  const [notes, setNotes] = useState<NotesState>({})
  const [saving, setSaving] = useState(false)

  const items: PreflightItem[] = ALL_KEYS.filter((k) => results[k]).map(
    (k) => ({
      key: k,
      result: results[k] as PreflightItemResult,
      note: notes[k],
    }),
  )
  const summary = preflightSummary(items, ALL_KEYS.length)

  async function handleSetResult(
    key: PreflightItemKey,
    result: PreflightItemResult,
  ) {
    const nextResults = { ...results, [key]: result }
    setResults(nextResults)
    if (result === 'ok') {
      const nextNotes = { ...notes }
      delete nextNotes[key]
      setNotes(nextNotes)
    }
    const nextItems: PreflightItem[] = ALL_KEYS.filter(
      (k) => nextResults[k],
    ).map((k) => ({
      key: k,
      result: nextResults[k] as PreflightItemResult,
      note: k === key && result === 'fail' ? notes[key] : notes[k],
    }))
    setSaving(true)
    try {
      await operatorApi.savePreflight(MISSION_ID, { items: nextItems })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title="Preflight checklist"
        missionId={MISSION_ID}
        active={4}
        right={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 32,
              padding: '0 12px',
              borderRadius: 16,
              background: 'var(--sf3)',
              fontWeight: 700,
              fontSize: 13,
              flex: 'none',
            }}
          >
            DRN-02 Hải Âu
          </span>
        }
      />
      <div style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SummaryBanner
            nOk={summary.nOk}
            nTotal={summary.nTotal}
            isPass={summary.isPass}
            isFail={summary.isFail}
            failKeys={summary.failKeys}
            saving={saving}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 18,
              alignItems: 'start',
            }}
          >
            {PREFLIGHT_GROUPS.map((group) => (
              <div
                key={group.title}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 12.5,
                    color: 'var(--tx2)',
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                  }}
                >
                  {group.title}
                </div>
                {group.items.map((def) => (
                  <PreflightItemRow
                    key={def.key}
                    def={def}
                    result={results[def.key] ?? null}
                    note={notes[def.key] ?? ''}
                    onSetResult={(result) => handleSetResult(def.key, result)}
                    onSetNote={(note) =>
                      setNotes((n) => ({ ...n, [def.key]: note }))
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryBanner({
  nOk,
  nTotal,
  isPass,
  isFail,
  failKeys,
  saving,
}: {
  nOk: number
  nTotal: number
  isPass: boolean
  isFail: boolean
  failKeys: string[]
  saving: boolean
}) {
  const bg = isFail ? 'var(--red-bg)' : isPass ? 'var(--green-bg)' : 'var(--sf)'
  const border = isFail
    ? 'var(--red-dot)'
    : isPass
      ? 'var(--green-dot)'
      : 'var(--bd)'
  const fg = isFail ? 'var(--red-fg)' : isPass ? 'var(--green-fg)' : 'var(--tx)'

  return (
    <div
      style={{
        display: 'flex',
        gap: 18,
        alignItems: 'center',
        padding: '12px 18px',
        borderRadius: 14,
        background: bg,
        border: `1.5px solid ${border}`,
        color: fg,
      }}
    >
      <div style={{ minWidth: 150 }}>
        <div
          className="odm-mono"
          style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}
        >
          {nOk}/{nTotal}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>mục đạt</div>
      </div>
      <div style={{ flex: 1 }}>
        {isPass ? (
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            PASS · đủ điều kiện cất cánh
          </div>
        ) : isFail ? (
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            FAIL · CHẶN BAY · Không đạt: <b>{failKeys.join(', ')}</b>
          </div>
        ) : (
          <div style={{ fontSize: 13.5 }}>
            {saving
              ? 'Đang lưu...'
              : 'Hoàn tất các mục còn lại để nhận kết quả preflight.'}
          </div>
        )}
      </div>
      {isPass ? (
        <a
          className="odm-btn odm-btn-ok"
          href={operatorHref({ screen: 'flight' })}
          style={{ minWidth: 220 }}
        >
          Tiếp tục tới buồng lái
        </a>
      ) : isFail ? (
        <button
          type="button"
          className="odm-btn odm-btn-rd"
          style={{ minWidth: 200 }}
        >
          Báo cáo sự cố
        </button>
      ) : (
        <button
          type="button"
          className="odm-btn"
          disabled
          style={{ minWidth: 220 }}
        >
          Tiếp tục tới buồng lái
        </button>
      )}
    </div>
  )
}
