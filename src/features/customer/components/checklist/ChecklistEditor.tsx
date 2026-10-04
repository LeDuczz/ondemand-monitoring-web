import { useI18n } from '../../../../shared/i18n'
import { Card } from '../../../../shared/components/ui'
import { checklistMessages } from '../../lib/checklist/messages'
import type { OrderChecklistEditorState } from '../../lib/checklist/useOrderChecklist'
import './Checklist.css'

export function ChecklistEditor({
  checklist,
  disabled = false,
  onReload,
}: {
  checklist: OrderChecklistEditorState
  disabled?: boolean
  onReload?: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const { status, rows } = checklist
  const ready = status === 'ready'
  return (
    <div role="region" aria-label={t.title}>
      <Card
        className="checklist-card"
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
          {rows.map((row, index) => (
            <div
              className={`checklist-row${row.selected ? '' : ' is-removed'}`}
              key={row.key}
            >
              <div className="checklist-row-heading">
                <label>
                  <input
                    type="checkbox"
                    checked={row.selected}
                    aria-label={t.select(index + 1)}
                    onChange={(event) =>
                      checklist.change(row.key, {
                        selected: event.target.checked,
                      })
                    }
                  />
                  <span>
                    {index + 1}. {row.sourceChecklistId ? t.title : t.custom}
                  </span>
                </label>
                {!row.sourceChecklistId && (
                  <button
                    type="button"
                    className="odm-btn odm-btn-gh"
                    onClick={() => checklist.remove(row.key)}
                  >
                    {t.remove}
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
              <span className="checklist-length">{row.content.length}/500</span>
            </div>
          ))}
          {ready && (
            <button
              type="button"
              className="odm-btn odm-btn-gh"
              disabled={checklist.selectedCount >= 100}
              onClick={checklist.add}
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
