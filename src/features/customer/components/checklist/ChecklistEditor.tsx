import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { Card } from '../../../../shared/components/ui'
import { checklistMessages } from '../../lib/checklist/messages'
import { normalizeContent } from '../../lib/checklist/types'
import type { OrderChecklistEditorState } from '../../lib/checklist/useOrderChecklist'
import './Checklist.css'

/** Rows shown before "show more" in the compact variant. */
const COMPACT_VISIBLE = 8

export function ChecklistEditor({
  checklist,
  disabled = false,
  onReload,
  variant = 'full',
}: {
  checklist: OrderChecklistEditorState
  disabled?: boolean
  onReload?: () => void
  /** `compact` renders one-line rows; a row expands to a textarea on edit. */
  variant?: 'full' | 'compact'
}) {
  const { t } = useI18n(checklistMessages)
  const { status, rows } = checklist
  const ready = status === 'ready'
  const compact = variant === 'compact'
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const openNewRow = useRef(false)
  const previousCount = useRef(rows.length)

  // A row added by the user opens straight into edit mode.
  useEffect(() => {
    if (openNewRow.current && rows.length > previousCount.current) {
      setEditingKey(rows[rows.length - 1].key)
    }
    openNewRow.current = false
    previousCount.current = rows.length
  }, [rows])

  useEffect(() => {
    if (editingKey)
      document.getElementById(`requirement-${editingKey}`)?.focus()
  }, [editingKey])

  const hiddenCount =
    compact && !showAll ? Math.max(0, rows.length - COMPACT_VISIBLE) : 0

  return (
    <div role="region" aria-label={t.title}>
      <Card
        className={`checklist-card${compact ? ' is-compact' : ''}`}
        title={t.title}
        actions={
          <span className="checklist-hint">
            {t.count(checklist.selectedCount)}
          </span>
        }
      >
        <p className="checklist-hint">{t.hint}</p>
        {status === 'idle' && <p>{t.choose}</p>}
        {status === 'loading' && <p role="status">{t.loading}</p>}
        {(status === 'error' || status === 'stale') && (
          <div role="alert" className="co-notice is-danger">
            <p>{status === 'stale' ? t.stale : checklist.error}</p>
            {status === 'stale' && <p>{t.discard}</p>}
            <button
              type="button"
              className="odm-btn odm-btn-gh"
              disabled={disabled}
              onClick={() => {
                checklist.reload()
                onReload?.()
              }}
            >
              {status === 'stale' ? t.reload : t.retry}
            </button>
          </div>
        )}
        {ready && !rows.length && <p>{t.empty}</p>}
        <fieldset disabled={disabled || !ready} className="checklist-fields">
          {rows.map((row, index) => {
            const normalizedLength = normalizeContent(row.content).length
            const invalid =
              row.selected && (normalizedLength < 1 || normalizedLength > 500)
            const expanded = !compact || editingKey === row.key || invalid
            if (hiddenCount && index >= COMPACT_VISIBLE && !expanded)
              return null
            const checkbox = (
              <input
                type="checkbox"
                className="checklist-check"
                checked={row.selected}
                aria-label={t.select(index + 1)}
                onChange={(event) =>
                  checklist.change(row.key, {
                    selected: event.target.checked,
                  })
                }
              />
            )
            if (!expanded) {
              return (
                <div
                  className={`checklist-row is-compact${row.selected ? '' : ' is-removed'}`}
                  key={row.key}
                >
                  {checkbox}
                  <span className="checklist-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="checklist-summary" title={row.content}>
                    {row.content || t.emptyContent}
                    {!row.sourceChecklistId && (
                      <span className="checklist-custom-tag">{t.custom}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="checklist-edit"
                    aria-label={t.editRow(index + 1)}
                    disabled={!row.selected}
                    onClick={() => setEditingKey(row.key)}
                  >
                    {t.edit}
                  </button>
                </div>
              )
            }
            const length = row.content.length
            const lengthState =
              length > 500 ? ' is-over' : length >= 450 ? ' is-near' : ''
            return (
              <div
                className={`checklist-row${row.selected ? '' : ' is-removed'}`}
                key={row.key}
              >
                {checkbox}
                <div className="checklist-row-main">
                  <div className="checklist-row-heading">
                    <span className="checklist-index">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {!row.sourceChecklistId && (
                      <span className="checklist-custom-tag">{t.custom}</span>
                    )}
                    {!row.sourceChecklistId && (
                      <button
                        type="button"
                        className="checklist-remove"
                        onClick={() => checklist.remove(row.key)}
                      >
                        {t.remove}
                      </button>
                    )}
                    {compact && (
                      <button
                        type="button"
                        className="checklist-done"
                        disabled={invalid}
                        onClick={() => setEditingKey(null)}
                      >
                        {t.done}
                      </button>
                    )}
                  </div>
                  <label
                    className="checklist-content-label"
                    htmlFor={`requirement-${row.key}`}
                  >
                    {t.content(index + 1)}
                  </label>
                  <textarea
                    id={`requirement-${row.key}`}
                    rows={2}
                    value={row.content}
                    disabled={!row.selected}
                    aria-invalid={row.selected && Boolean(checklist.validation)}
                    onChange={(event) =>
                      checklist.change(row.key, { content: event.target.value })
                    }
                  />
                  <span className={`checklist-length${lengthState}`}>
                    {length} / 500
                  </span>
                </div>
              </div>
            )
          })}
          {hiddenCount > 0 && (
            <button
              type="button"
              className="checklist-more"
              onClick={() => setShowAll(true)}
            >
              {t.showMore(hiddenCount)}
            </button>
          )}
          {compact && showAll && rows.length > COMPACT_VISIBLE && (
            <button
              type="button"
              className="checklist-more"
              onClick={() => setShowAll(false)}
            >
              {t.showLess}
            </button>
          )}
          {ready && (
            <button
              type="button"
              className="checklist-add"
              disabled={checklist.selectedCount >= 100}
              onClick={() => {
                openNewRow.current = true
                setShowAll(true)
                checklist.add()
              }}
            >
              + {t.add}
            </button>
          )}
        </fieldset>
        {ready && checklist.selectedCount === 0 && (
          <p className="checklist-hint">{t.none}</p>
        )}
        {checklist.validation && (
          <p role="alert" className="co-notice is-danger">
            {checklist.validation}
          </p>
        )}
      </Card>
    </div>
  )
}
