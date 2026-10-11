import { Fragment, useEffect, useRef, useState } from 'react'
import { Icon } from '../../../../shared/components/Icon'
import { useI18n } from '../../../../shared/i18n'
import { Card } from '../../../../shared/components/ui'
import { checklistMessages } from '../../lib/checklist/messages'
import { normalizeContent, type ChecklistRow } from '../../lib/checklist/types'
import type { OrderChecklistEditorState } from '../../lib/checklist/useOrderChecklist'
import './Checklist.css'

/** Rows shown before "show more" in the compact variant. */
const COMPACT_VISIBLE = 50

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
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'list' | 'group'>('list')
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

  const needle = query.trim().toLowerCase()
  const searching = compact && needle !== ''
  const hiddenCount =
    compact && !showAll && !searching
      ? Math.max(0, rows.length - COMPACT_VISIBLE)
      : 0
  const addRow = () => {
    openNewRow.current = true
    setShowAll(true)
    setQuery('')
    checklist.add()
  }

  const grouped = compact && view === 'group'
  const selectedTotal = rows.filter((row) => row.selected).length
  const ordered = rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) =>
      grouped ? Number(b.row.selected) - Number(a.row.selected) : 0,
    )
    .map((entry, pos, all) => ({
      ...entry,
      heading:
        grouped && (pos === 0 || all[pos - 1].row.selected !== entry.row.selected)
          ? entry.row.selected
            ? t.groupSelected(selectedTotal)
            : t.groupUnselected(rows.length - selectedTotal)
          : null,
    }))
  const renderRow = (row: ChecklistRow, index: number) => {
            const normalizedLength = normalizeContent(row.content).length
            const invalid =
              row.selected && (normalizedLength < 1 || normalizedLength > 500)
            const expanded = !compact || editingKey === row.key || invalid
            if (hiddenCount && index >= COMPACT_VISIBLE && !expanded)
              return null
            if (
              searching &&
              !expanded &&
              !row.content.toLowerCase().includes(needle)
            )
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
                  <span
                    className="checklist-summary"
                    title={row.content}
                    onClick={() => {
                      // Click-to-edit, but never while the user is selecting text.
                      if (row.selected && !window.getSelection()?.toString())
                        setEditingKey(row.key)
                    }}
                  >
                    {row.content || t.emptyContent}
                    {!row.sourceChecklistId && (
                      <span className="checklist-custom-tag">{t.custom}</span>
                    )}
                  </span>
                  <span className="checklist-length">
                    {row.content.length} / 500
                  </span>
                  <button
                    type="button"
                    className="checklist-icon-btn"
                    aria-label={t.editRow(index + 1)}
                    title={t.edit}
                    disabled={!row.selected}
                    onClick={() => setEditingKey(row.key)}
                  >
                    <Icon name="edit" width={16} height={16} aria-hidden="true" />
                  </button>
                  {!row.sourceChecklistId && (
                    <button
                      type="button"
                      className="checklist-icon-btn is-danger"
                      aria-label={`${t.remove} ${index + 1}`}
                      title={t.remove}
                      onClick={() => checklist.remove(row.key)}
                    >
                      <Icon name="trash" width={16} height={16} aria-hidden="true" />
                    </button>
                  )}
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
                    {row.sourceChecklistId && (
                      <span className="checklist-custom-tag is-default">{t.defaultItem}</span>
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
                    {row.sourceChecklistId && (
                      <button
                        type="button"
                        className="checklist-remove"
                        onClick={() => checklist.change(row.key, { selected: !row.selected })}
                      >
                        {row.selected ? t.removeDefault : t.restoreDefault}
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
  }
  return (
    <div role="region" aria-label={t.title}>
      <Card
        className={`checklist-card${compact ? ' is-compact' : ''}`}
        title={t.title}
        actions={
          <>
            <span className="checklist-hint">
              {t.count(checklist.selectedCount)}
            </span>
            {compact && ready && (
              <button
                type="button"
                className="checklist-add-top"
                disabled={disabled || checklist.selectedCount >= 100}
                onClick={addRow}
              >
                + {t.add}
              </button>
            )}
          </>
        }
      >
        <p className="checklist-hint">{t.hint}</p>
        {ready && <p className="checklist-pricing-notice">{t.pricingNotice}</p>}
        {compact && ready && rows.length > 0 && (
          <div className="checklist-toolbar">
            <label className="checklist-selectall">
              <input
                type="checkbox"
                disabled={disabled}
                checked={rows.every((row) => row.selected)}
                onChange={(event) => {
                  for (const row of rows)
                    if (row.selected !== event.target.checked)
                      checklist.change(row.key, {
                        selected: event.target.checked,
                      })
                }}
              />
              {t.selectAll(rows.length)}
            </label>
            <button
              type="button"
              className="checklist-clear"
              disabled={disabled || checklist.selectedCount === 0}
              onClick={() => {
                for (const row of rows)
                  if (row.selected) checklist.change(row.key, { selected: false })
              }}
            >
              {t.deselectAll}
            </button>
            <input
              type="search"
              className="checklist-search"
              aria-label={t.searchLabel}
              placeholder={t.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="checklist-view" role="group" aria-label={t.viewLabel}>
              <button
                type="button"
                aria-pressed={view === 'list'}
                onClick={() => setView('list')}
              >
                <Icon name="menu" width={14} height={14} aria-hidden="true" />
                {t.viewList}
              </button>
              <button
                type="button"
                aria-pressed={view === 'group'}
                onClick={() => setView('group')}
              >
                <Icon name="clipboard" width={14} height={14} aria-hidden="true" />
                {t.viewGroup}
              </button>
            </div>
          </div>
        )}
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
          {ordered.map(({ row, index, heading }) => (
            <Fragment key={row.key}>
              {heading && <h3 className="checklist-group-title">{heading}</h3>}
              {renderRow(row, index)}
            </Fragment>
          ))}
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
          {searching && ready && rows.length > 0 &&
            !rows.some((row) => row.content.toLowerCase().includes(needle)) && (
              <p className="checklist-hint">{t.noMatch}</p>
            )}
          {ready && !compact && (
            <button
              type="button"
              className="checklist-add"
              disabled={checklist.selectedCount >= 100}
              onClick={addRow}
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
