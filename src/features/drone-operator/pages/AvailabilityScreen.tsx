import { useMemo, useState } from 'react'

import { EmptyState, LoadingState } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { operatorApi } from '../api/operatorApi'
import { mergeSlots, slotKey, type AvailabilityStatus } from '../lib/availabilitySlots'
import { AvailabilityGrid, type MissionOverlay } from './AvailabilityGrid'

const MODE_LABEL: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'Rảnh',
  BUSY: 'Bận',
  OFF: 'Nghỉ',
}

const MODE_CLASS: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'odm-btn-ok',
  BUSY: '',
  OFF: 'odm-btn-rd',
}

// Fixed to the design's reference week (21/09 - 27/09/2026, Tuần 39). A real
// implementation would derive this from the demo clock plus ‹ › navigation;
// out of scope for the mock.
const WEEK_KEY = '2026-W39'
const WEEK_DAYS = [
  '2026-09-21',
  '2026-09-22',
  '2026-09-23',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
  '2026-09-27',
]

const MISSION_OVERLAYS: MissionOverlay[] = [
  { day: '2026-09-21', time: '16:00', label: '0139-1 Đã nhận', tone: 'green' },
  { day: '2026-09-24', time: '13:00', label: '0152-1 Chờ phản hồi', tone: 'gray' },
  { day: '2026-09-25', time: '08:00', label: '0154-1 Chờ phản hồi', tone: 'gray' },
]

export function AvailabilityScreen() {
  const query = useApiQuery((signal) => operatorApi.getAvailability(WEEK_KEY, signal), [])
  const [localSlots, setLocalSlots] = useState<Record<string, AvailabilityStatus> | null>(null)
  const [selection, setSelection] = useState<string[]>([])
  const [mode, setMode] = useState<AvailabilityStatus>('AVAILABLE')
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')

  const slots = localSlots ?? query.data?.slots ?? {}
  const selectedSet = useMemo(() => new Set(selection), [selection])

  if (query.loading) return <LoadingState />
  if (query.error) {
    return (
      <EmptyState
        title="Không tải được lịch rảnh"
        description="Mất kết nối hoặc máy chủ đang bận."
        action={
          <button type="button" className="odm-btn odm-btn-p" onClick={() => query.reload()}>
            Thử lại
          </button>
        }
      />
    )
  }

  function applyMode() {
    if (selection.length === 0) return
    setLocalSlots(mergeSlots(slots, selection, mode))
    setSelection([])
  }

  async function handleSave() {
    setSaving(true)
    setSaveState('idle')
    try {
      await operatorApi.saveAvailability({ week: WEEK_KEY, slots })
      setSaveState('saved')
    } catch {
      setSaveState('error')
    } finally {
      setSaving(false)
    }
  }

  const dirty = localSlots !== null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" className="odm-btn odm-btn-sm" aria-label="Tuần trước">
            ‹
          </button>
          <span style={{ fontWeight: 600, fontSize: 13.5 }}>21/09 – 27/09/2026 · Tuần 39</span>
          <button type="button" className="odm-btn odm-btn-sm" aria-label="Tuần sau">
            ›
          </button>
        </div>
        <button
          type="button"
          className="odm-btn odm-btn-p"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      {saveState === 'saved' ? (
        <Banner tone="green">Đã lưu lịch rảnh tuần 39</Banner>
      ) : saveState === 'error' ? (
        <Banner tone="red">Lưu thất bại. Vui lòng thử lại.</Banner>
      ) : !dirty && Object.keys(slots).length === 0 ? (
        <Banner tone="yellow">Chưa khai báo lịch rảnh cho tuần này.</Banner>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, color: 'var(--tx3)' }}>Khai báo:</span>
        {(['AVAILABLE', 'BUSY', 'OFF'] as AvailabilityStatus[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`odm-btn odm-btn-sm ${mode === m ? MODE_CLASS[m] : ''}`}
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m)
              if (selection.length > 0) {
                setLocalSlots(mergeSlots(slots, selection, m))
                setSelection([])
              }
            }}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
        {selection.length > 0 ? (
          <>
            <span style={{ fontSize: 12, color: 'var(--tx3)' }}>
              Kéo trên lưới... đang chọn {selection.length} ô
            </span>
            <button
              type="button"
              className="odm-btn odm-btn-sm"
              onClick={() => setSelection([])}
            >
              Bỏ chọn
            </button>
            <button type="button" className="odm-btn odm-btn-sm odm-btn-p" onClick={applyMode}>
              Áp dụng
            </button>
          </>
        ) : null}
      </div>

      <AvailabilityGrid
        days={WEEK_DAYS}
        slots={applySelectionPreview(slots, selectedSet, mode)}
        overlays={MISSION_OVERLAYS}
        onSelectionChange={setSelection}
      />
    </div>
  )
}

function applySelectionPreview(
  slots: Record<string, AvailabilityStatus>,
  selected: Set<string>,
  mode: AvailabilityStatus,
): Record<string, AvailabilityStatus> {
  if (selected.size === 0) return slots
  const next = { ...slots }
  for (const key of selected) next[key] = mode
  return next
}

function Banner({ tone, children }: { tone: 'green' | 'red' | 'yellow'; children: React.ReactNode }) {
  return (
    <div
      style={{
        marginBottom: 14,
        padding: '10px 14px',
        borderRadius: 8,
        background: `var(--${tone}-bg)`,
        color: `var(--${tone}-fg)`,
        border: `1px solid var(--${tone}-dot)`,
        fontSize: 13,
      }}
    >
      {children}
    </div>
  )
}

// re-export for tests / potential reuse elsewhere
export { slotKey }
