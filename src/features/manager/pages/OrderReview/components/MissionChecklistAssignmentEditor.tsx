import { useEffect, useState } from 'react'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../../api/planningApi'
import { planningError } from '../../../lib/planningErrors'
import type { OrderChecklistSnapshot } from '../../../types/orders'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { useI18n } from '../../../../../shared/i18n'
import { missionChecklistAssignmentEditorMessages } from './MissionChecklistAssignmentEditor.messages'

export function MissionChecklistAssignmentEditor({
  missionId,
  revision,
  editable,
  items,
  onChanged,
  onDraftState,
}: {
  missionId: string
  revision: number
  editable: boolean
  items: OrderChecklistSnapshot[]
  onChanged: () => void
  onDraftState?: (missionId: string, dirty: boolean, busy: boolean) => void
}) {
  const { t } = useI18n(missionChecklistAssignmentEditorMessages)

  const query = useApiQuery(
    (signal) => planningApi.getAssignments(missionId, signal),
    [missionId, revision],
  )
  const [selected, setSelected] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    onDraftState?.(missionId, dirty, busy)
  }, [missionId, dirty, busy, onDraftState])
  useEffect(() => {
    if (query.data && !dirty)
      setSelected(
        query.data.assignments
          .filter((a) => a.active)
          .map((a) => a.orderChecklistItemId),
      )
  }, [query.data, dirty])
  async function save() {
    if (
      busy ||
      !editable ||
      query.loading ||
      query.error ||
      query.data?.revision !== revision
    )
      return
    setBusy(true)
    setMessage('')
    try {
      await planningApi.updateMissionChecklistAssignments(
        missionId,
        revision,
        items.filter((i) => selected.includes(i.id)).map((i) => i.id),
      )
      setDirty(false)
      query.reload()
      onChanged()
      setMessage(t.checklistAssignmentSaved)
    } catch (error) {
      setMessage(planningError(error))
      query.reload()
      onChanged()
    } finally {
      setBusy(false)
    }
  }
  return (
    <details
      className="odm-planning-editor"
      open={!editable || dirty || Boolean(message) || undefined}
    >
      <summary>
        {t.checklist}{' '}
        {editable
          ? t.selectedCount(selected.length, items.length)
          : t.itemCount(query.data?.assignments.filter((a) => a.active).length ?? '…')}
      </summary>
      {query.loading && <p role="status">{t.loadingAssignment}</p>}
      {query.error ? (
        <p role="alert">
          {planningError(query.error)}{' '}
          <button type="button" onClick={query.reload}>
            {t.reload}
          </button>
        </p>
      ) : null}
      {!editable && !query.loading && !query.error && (
        <ul
          className="odm-mission-checklist"
          aria-label={`Checklist ${missionId}`}
        >
          {query.data?.assignments
            .filter((a) => a.active)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((item) => (
              <li key={item.assignmentId}>
                <span className="odm-mission-check" aria-label={t.assigned}>
                  <OrderIcon name="check" size={15} />
                </span>
                {item.content}
              </li>
            ))}
          {!query.data?.assignments.some((a) => a.active) && (
            <li className="odm-mission-meta">{t.noChecklistAssignedYet}</li>
          )}
        </ul>
      )}
      {editable && (
        <>
          {items.length > 1 && (
            <div className="odm-planning-bulk">
              <button
                type="button"
                className="odm-btn"
                disabled={busy || query.loading || selected.length === items.length}
                onClick={() => {
                  setDirty(true)
                  setSelected(items.map((item) => item.id))
                }}
              >
                {t.selectAll}
              </button>
              <button
                type="button"
                className="odm-btn"
                disabled={busy || query.loading || selected.length === 0}
                onClick={() => {
                  setDirty(true)
                  setSelected([])
                }}
              >
                {t.deselectAll}
              </button>
            </div>
          )}
          <fieldset
            disabled={
              !editable || busy || query.loading || Boolean(query.error)
            }
            aria-label={`Checklist ${missionId}`}
          >
            {[...items]
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((item) => (
                <label key={item.id} className="odm-planning-item">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={(event) => {
                      setDirty(true)
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, item.id]
                          : current.filter((id) => id !== item.id),
                      )
                    }}
                  />
                  <span>
                    {item.content}
                    <small
                      className={
                        item.sourceType === 'SERVICE_TEMPLATE'
                          ? 'odm-planning-tag'
                          : 'odm-planning-tag is-customer'
                      }
                    >
                      {item.sourceType === 'SERVICE_TEMPLATE'
                        ? t.serviceTemplate
                        : t.customerAdded}
                    </small>
                  </span>
                </label>
              ))}
            {items.length === 0 && <p>{t.noChecklistRequirementYet}</p>}
          </fieldset>
        </>
      )}
      {message && <p role="status">{message}</p>}
      {editable && (
        <button
          className="odm-btn odm-btn-p"
          type="button"
          disabled={
            !dirty ||
            busy ||
            query.loading ||
            Boolean(query.error) ||
            query.data?.revision !== revision
          }
          onClick={() => void save()}
        >
          {busy ? t.saving : t.saveAssignment}
        </button>
      )}
    </details>
  )
}
