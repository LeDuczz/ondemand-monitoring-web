import { useEffect, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../api/planningApi'
import { planningError } from '../../lib/planningErrors'
import type { OrderChecklistSnapshot } from '../../types/orders'

export function MissionChecklistAssignmentEditor({
  missionId,
  revision,
  editable,
  items,
  onChanged,
}: {
  missionId: string
  revision: number
  editable: boolean
  items: OrderChecklistSnapshot[]
  onChanged: () => void
}) {
  const query = useApiQuery(
    (signal) => planningApi.getAssignments(missionId, signal),
    [missionId, revision],
  )
  const [selected, setSelected] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
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
      setMessage('Đã lưu phân công checklist.')
    } catch (error) {
      setMessage(planningError(error))
      query.reload()
      onChanged()
    } finally {
      setBusy(false)
    }
  }
  return (
    <details className="odm-planning-editor">
      <summary>
        Phân công checklist —{' '}
        {query.data?.assignments.filter((a) => a.active).length ?? '…'} mục
      </summary>
      {query.loading && <p role="status">Đang tải phân công…</p>}
      {query.error ? (
        <p role="alert">
          {planningError(query.error)}{' '}
          <button type="button" onClick={query.reload}>
            Tải lại
          </button>
        </p>
      ) : null}
      {!editable && (
        <p>Chỉ đọc — Mission đã chốt hoặc không còn ở bước planning.</p>
      )}
      <p>
        Một yêu cầu có thể được phân công cho nhiều Mission; lặp lại không phải
        lỗi.
      </p>
      <fieldset
        disabled={!editable || busy || query.loading || Boolean(query.error)}
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
                <small>
                  {item.sourceType === 'SERVICE_TEMPLATE'
                    ? 'Mẫu dịch vụ'
                    : 'Khách hàng bổ sung'}
                </small>
              </span>
            </label>
          ))}
        {items.length === 0 && <p>Order có checklist rỗng.</p>}
      </fieldset>
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
          {busy ? 'Đang lưu…' : 'Lưu phân công'}
        </button>
      )}
    </details>
  )
}
