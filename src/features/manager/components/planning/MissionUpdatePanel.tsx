import { useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { missionsApi } from '../../api/missionsApi'
import { planningApi } from '../../api/planningApi'
import { planningError } from '../../lib/planningErrors'
import type { OrderChecklistSnapshot } from '../../types/orders'

function toLocalInput(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Edit button + form for `PUT /api/missions/{id}`: schedule and (required) checklist of a PLANNING Mission. */
export function MissionUpdatePanel({
  missionId,
  missionCode,
  scheduledStartAt,
  scheduledEndAt,
  revision,
  items,
  uncoveredItemIds,
  disabled,
  onUpdated,
}: {
  missionId: string
  missionCode?: string
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
  revision: number
  items: OrderChecklistSnapshot[]
  uncoveredItemIds: string[]
  disabled: boolean
  onUpdated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const assignments = useApiQuery(
    (signal) => (open ? planningApi.getAssignments(missionId, signal) : Promise.resolve(null)),
    [missionId, revision, open],
  )
  const owned = (assignments.data?.assignments ?? [])
    .filter((a) => a.active)
    .map((a) => a.orderChecklistItemId)
  const selectable = items
    .filter((i) => owned.includes(i.id) || uncoveredItemIds.includes(i.id))
    .sort((a, b) => a.displayOrder - b.displayOrder)

  function openForm() {
    setStart(toLocalInput(scheduledStartAt))
    setEnd(toLocalInput(scheduledEndAt))
    setSelected([])
    setMessage('')
    setOpen(true)
  }

  // Seed the selection once the current assignments are known.
  const [seeded, setSeeded] = useState(false)
  if (open && assignments.data && !seeded) {
    setSelected(owned)
    setSeeded(true)
  }

  async function submit() {
    if (busy) return
    if (selected.length === 0) {
      setMessage('Mission phải có ít nhất một checklist.')
      return
    }
    const s = new Date(start)
    const e = new Date(end)
    if (!start || !end || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e <= s) {
      setMessage('Thời gian bay không hợp lệ.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      await missionsApi.updateMission(missionId, {
        scheduledStartAt: s.toISOString(),
        scheduledEndAt: e.toISOString(),
        checklistIds: selected,
      })
      setOpen(false)
      setSeeded(false)
      onUpdated()
    } catch (error) {
      setMessage(planningError(error))
    } finally {
      setBusy(false)
    }
  }

  if (!open)
    return (
      <div className="odm-mission-actions">
        <button type="button" className="odm-btn" disabled={disabled} onClick={openForm}>
          Chỉnh sửa Mission {missionCode}
        </button>
      </div>
    )

  return (
    <form
      className="odm-planning-adjustment"
      aria-label={`Chỉnh sửa Mission ${missionCode ?? ''}`}
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <h3>Chỉnh sửa Mission {missionCode}</h3>
      <div className="odm-or-form-row">
        <label className="odm-or-field">
          <span className="odm-or-field-label">Bắt đầu</span>
          <input
            className="odm-or-input"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="odm-or-field">
          <span className="odm-or-field-label">Kết thúc</span>
          <input
            className="odm-or-input"
            type="datetime-local"
            min={start || undefined}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <fieldset aria-label="Checklist của Mission" disabled={busy || assignments.loading}>
        <legend>Checklist (bắt buộc, tối thiểu 1 mục)</legend>
        {selectable.map((item) => (
          <label key={item.id} className="odm-planning-item">
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                )
              }
            />
            <span>{item.content}</span>
          </label>
        ))}
        {!assignments.loading && selectable.length === 0 && <p>Không có checklist khả dụng.</p>}
      </fieldset>
      {message && <p role="alert" className="odm-planning-notice">{message}</p>}
      <button className="odm-btn odm-btn-p" disabled={busy || assignments.loading}>
        {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      <button
        type="button"
        className="odm-btn"
        disabled={busy}
        onClick={() => {
          setOpen(false)
          setSeeded(false)
        }}
      >
        Đóng
      </button>
    </form>
  )
}
