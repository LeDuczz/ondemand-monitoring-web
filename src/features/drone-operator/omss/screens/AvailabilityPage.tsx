import { useState, useCallback } from 'react'
import type { AvailabilitySlot, AvailabilityStatus, MissionOverlay } from '../types'
import availData from '../../../../mocks/data/operator-availability.json'

type SlotKey = string // `${date}_${hour}_${minute}`

function key(date: string, hour: number, minute: number): SlotKey {
  return `${date}_${hour}_${minute}`
}

function isoWeekStr(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const wn = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(wn).padStart(2, '0')}`
}

function weekDates(weekStr: string): Date[] {
  const [yearStr, wkStr] = weekStr.split('-W')
  const year = parseInt(yearStr ?? '2026', 10)
  const wk = parseInt(wkStr ?? '1', 10)
  // Get Monday of that ISO week
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const startOfWeek = new Date(jan4)
  startOfWeek.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (wk - 1) * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setUTCDate(startOfWeek.getUTCDate() + i)
    return d
  })
}

function fmtDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0] ?? ''
}

const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 6) // 06–19

function buildInitialMap(slots: AvailabilitySlot[]): Record<SlotKey, AvailabilityStatus> {
  const m: Record<SlotKey, AvailabilityStatus> = {}
  for (const s of slots) {
    m[key(s.date, s.hour, s.minute)] = s.status
  }
  return m
}

function missionOverlapsSlot(overlays: MissionOverlay[], date: string, hour: number, minute: number): MissionOverlay | undefined {
  const slotMinutes = hour * 60 + minute
  return overlays.find((o) => {
    if (o.date !== date) return false
    const start = o.startHour * 60 + o.startMinute
    const end = o.endHour * 60 + o.endMinute
    return slotMinutes >= start && slotMinutes < end
  })
}

const INITIAL_WEEK = '2026-W39'

export default function AvailabilityPage() {
  const [week, setWeek] = useState(INITIAL_WEEK)
  const [slotMap, setSlotMap] = useState<Record<SlotKey, AvailabilityStatus>>(
    () => buildInitialMap(availData.slots as AvailabilitySlot[]),
  )
  const [selecting, setSelecting] = useState<Set<SlotKey>>(new Set())
  const [dragStart, setDragStart] = useState<SlotKey | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectionLabel, setSelectionLabel] = useState('')

  const overlays = availData.missionOverlays as MissionOverlay[]
  const dates = weekDates(week)

  function prevWeek() {
    const d = weekDates(week)[0]!
    d.setUTCDate(d.getUTCDate() - 7)
    setWeek(isoWeekStr(d))
  }

  function nextWeek() {
    const d = weekDates(week)[0]!
    d.setUTCDate(d.getUTCDate() + 7)
    setWeek(isoWeekStr(d))
  }

  function formatWeekLabel() {
    const start = dates[0]!
    const end = dates[6]!
    const [, wk] = week.split('-W')
    return `${fmtDate(start)} – ${fmtDate(end)}/${end.getUTCFullYear()} · Tuần ${wk}`
  }

  function handleMouseDown(slotKey: SlotKey, date: string, hour: number, minute: number) {
    const overlay = missionOverlapsSlot(overlays, date, hour, minute)
    if (overlay) return // can't select mission slots
    const k = slotKey
    setDragStart(k)
    setIsDragging(true)
    const sel = new Set<SlotKey>([k])
    setSelecting(sel)
    updateSelectionLabel(sel, dates)
  }

  function handleMouseEnter(_k: SlotKey, date: string, hour: number, minute: number) {
    if (!isDragging || !dragStart) return
    const overlay = missionOverlapsSlot(overlays, date, hour, minute)
    if (overlay) return

    // Expand selection rectangle between dragStart and current
    const [startDate, startHourStr, startMinStr] = dragStart.split('_')
    const startDateIdx = dates.findIndex((d) => toISODate(d) === startDate)
    const curDateIdx = dates.findIndex((d) => toISODate(d) === date)
    const startSlotMin = parseInt(startHourStr ?? '6') * 60 + parseInt(startMinStr ?? '0')
    const curSlotMin = hour * 60 + minute

    const minDateIdx = Math.min(startDateIdx, curDateIdx)
    const maxDateIdx = Math.max(startDateIdx, curDateIdx)
    const minSlotMin = Math.min(startSlotMin, curSlotMin)
    const maxSlotMin = Math.max(startSlotMin, curSlotMin)

    const sel = new Set<SlotKey>()
    for (let di = minDateIdx; di <= maxDateIdx; di++) {
      const d = dates[di]
      if (!d) continue
      const dStr = toISODate(d)
      for (const h of HOURS) {
        for (const m of [0, 30]) {
          const sm = h * 60 + m
          if (sm >= minSlotMin && sm <= maxSlotMin) {
            const over = missionOverlapsSlot(overlays, dStr, h, m)
            if (!over) sel.add(key(dStr, h, m))
          }
        }
      }
    }
    setSelecting(sel)
    updateSelectionLabel(sel, dates)
  }

  function updateSelectionLabel(sel: Set<SlotKey>, ds: Date[]) {
    if (sel.size === 0) { setSelectionLabel(''); return }
    const keys = Array.from(sel).sort()
    const first = keys[0]!.split('_')
    const last = keys[keys.length - 1]!.split('_')
    const dateStr = first[0] ?? ''
    const d = ds.find((x) => toISODate(x) === dateStr)
    const wdLabel = d ? `${WEEKDAY_SHORT[ds.indexOf(d)]} ${fmtDate(d)}` : dateStr
    const startH = first[1] ?? '6'
    const startM = first[2] === '0' ? '00' : '30'
    const endH = last[1]
    const endMin = last[2] === '0' ? '30' : '00'
    const endHStr = endMin === '00' ? String(parseInt(endH ?? startH) + 1) : endH
    setSelectionLabel(`Kéo trên lưới để chọn khoảng giờ · đang chọn ${wdLabel} ${startH}:${startM}–${endHStr}:${endMin}`)
  }

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragStart(null)
  }, [])

  function applyStatus(status: AvailabilityStatus) {
    if (selecting.size === 0) return
    const updated = { ...slotMap }
    for (const k of selecting) {
      updated[k] = status
    }
    setSlotMap(updated)
    setSelecting(new Set())
    setSelectionLabel('')
    setSaved(false)
  }

  function clearSelection() {
    setSelecting(new Set())
    setSelectionLabel('')
  }

  function handleSave() {
    // In real app: call operatorApi.saveAvailability(...)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', userSelect: 'none' }}
      onMouseUp={handleMouseUp}
    >
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4, fontFamily: 'var(--font-data)' }}>operator_availability</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 18px' }}>Lịch rảnh của tôi</h1>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="op-btn op-btn-ghost" style={{ padding: '5px 10px', fontSize: 13 }} onClick={prevWeek}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', minWidth: 200, textAlign: 'center' }}>{formatWeekLabel()}</span>
          <button className="op-btn op-btn-ghost" style={{ padding: '5px 10px', fontSize: 13 }} onClick={nextWeek}>›</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
          {(['AVAILABLE', 'BUSY', 'OFF'] as AvailabilityStatus[]).map((s) => (
            <button
              key={s}
              className="op-btn op-btn-ghost"
              style={{ fontSize: 12, padding: '5px 12px', opacity: selecting.size === 0 ? .5 : 1 }}
              onClick={() => applyStatus(s)}
              disabled={selecting.size === 0}
            >
              {s === 'AVAILABLE' ? 'Rảnh' : s === 'BUSY' ? 'Bận' : 'Nghỉ'}
            </button>
          ))}
          {selecting.size > 0 && (
            <button className="op-btn op-btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={clearSelection}>Bỏ chọn</button>
          )}
        </div>

        <button className="op-btn op-btn-primary" style={{ marginLeft: 'auto', fontSize: 13 }} onClick={handleSave}>
          Lưu thay đổi
        </button>
      </div>

      {saved && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontSize: 13, color: '#166534' }}>
          ✓ Đã lưu lịch rảnh thành công
        </div>
      )}

      {selectionLabel && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, fontStyle: 'italic' }}>{selectionLabel}</div>
      )}

      {/* Grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 700 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
            <div />
            {dates.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', padding: '4px 0' }}>
                {WEEKDAY_SHORT[i]} {fmtDate(d)}
              </div>
            ))}
          </div>

          {/* Rows */}
          {HOURS.map((hour) => (
            [0, 30].map((minute) => (
              <div
                key={`${hour}_${minute}`}
                style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', gap: 2, marginBottom: 2 }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                  {minute === 0 ? `${String(hour).padStart(2, '0')}:00` : ''}
                </div>
                {dates.map((d, di) => {
                  const dateStr = toISODate(d)
                  const k = key(dateStr, hour, minute)
                  const status = slotMap[k]
                  const overlay = missionOverlapsSlot(overlays, dateStr, hour, minute)
                  const isSelected = selecting.has(k)
                  const isOff = status === 'OFF'

                  let bg = '#f9fafb'
                  let border = 'var(--border)'
                  let opacity = 1

                  if (overlay) {
                    bg = '#ede9fe'
                    border = '#a78bfa'
                  } else if (isSelected) {
                    bg = '#dbeafe'
                    border = '#3b82f6'
                  } else if (status === 'AVAILABLE') {
                    bg = '#dcfce7'
                    border = '#86efac'
                  } else if (status === 'BUSY') {
                    bg = 'var(--surface-2)'
                    border = 'var(--border)'
                  } else if (isOff) {
                    bg = 'transparent'
                    opacity = .5
                  }

                  return (
                    <div
                      key={di}
                      style={{
                        height: 18,
                        background: bg,
                        border: `1px solid ${border}`,
                        borderRadius: 2,
                        cursor: overlay ? 'default' : 'pointer',
                        opacity,
                        backgroundImage: isOff && !overlay ? 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,.06) 3px, rgba(0,0,0,.06) 4px)' : undefined,
                        position: 'relative',
                      }}
                      onMouseDown={() => handleMouseDown(k, dateStr, hour, minute)}
                      onMouseEnter={() => handleMouseEnter(k, dateStr, hour, minute)}
                      title={overlay ? `Mission: ${overlay.missionId}` : status ?? 'Chưa khai báo'}
                    >
                      {overlay && minute === overlay.startMinute && hour === overlay.startHour && (
                        <span style={{ fontSize: 8, color: '#7c3aed', fontWeight: 700, position: 'absolute', left: 2, top: 1, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%' }}>
                          {overlay.missionId.split('-')[2]}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        {[
          { bg: '#dcfce7', border: '#86efac', label: 'Rảnh' },
          { bg: 'var(--surface-2)', border: 'var(--border)', label: 'Bận' },
          { bg: 'transparent', border: 'var(--border)', label: 'Nghỉ', striped: true },
          { bg: '#ede9fe', border: '#a78bfa', label: 'Mission đã xếp' },
          { bg: '#dbeafe', border: '#3b82f6', label: 'Đang chọn' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 14, height: 14, borderRadius: 2,
              background: l.bg, border: `1px solid ${l.border}`,
              backgroundImage: l.striped ? 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,.06) 3px, rgba(0,0,0,.06) 4px)' : undefined,
            }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
