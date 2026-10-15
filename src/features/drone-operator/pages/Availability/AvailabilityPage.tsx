import { useMemo, useState } from 'react'

import {
  EmptyState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { operatorApi } from '../../api/operatorApi'
import {
  mergeSlots,
  type AvailabilityStatus,
} from '../../lib/availabilitySlots'
import {
  applySelectionPreview,
  OVERLAY_SHAPE,
  WEEK_DAYS,
  WEEK_KEY,
} from './availabilityHelpers'
import { AvailabilityBanner } from './components/AvailabilityBanner'
import {
  AvailabilityGrid,
  type MissionOverlay,
} from './components/AvailabilityGrid'
import { ModeSelector } from './components/ModeSelector'
import { WeekToolbar } from './components/WeekToolbar'
import { availabilityPageMessages } from './AvailabilityPage.messages'

export function AvailabilityPage() {
  const query = useApiQuery(
    (signal) => operatorApi.getAvailability(WEEK_KEY, signal),
    [],
  )
  const [localSlots, setLocalSlots] = useState<Record<
    string,
    AvailabilityStatus
  > | null>(null)
  const [selection, setSelection] = useState<string[]>([])
  const [mode, setMode] = useState<AvailabilityStatus>('AVAILABLE')
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const { t } = useI18n(availabilityPageMessages)

  const slots = localSlots ?? query.data?.slots ?? {}
  const selectedSet = useMemo(() => new Set(selection), [selection])
  const missionOverlays: MissionOverlay[] = OVERLAY_SHAPE.map((o, i) => ({
    ...o,
    label: t.overlayLabels[i],
  }))

  if (query.loading) return <LoadingState />
  if (query.error) {
    return (
      <EmptyState
        title={t.loadFailedTitle}
        description={t.loadFailedDesc}
        action={
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => query.reload()}
          >
            {t.retry}
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
      <WeekToolbar saving={saving} dirty={dirty} onSave={handleSave} />

      <AvailabilityBanner
        saveState={saveState}
        dirty={dirty}
        isEmpty={Object.keys(slots).length === 0}
      />

      <ModeSelector
        mode={mode}
        selectionCount={selection.length}
        onModeChange={(m) => {
          setMode(m)
          if (selection.length > 0) {
            setLocalSlots(mergeSlots(slots, selection, m))
            setSelection([])
          }
        }}
        onDeselect={() => setSelection([])}
        onApply={applyMode}
      />

      <AvailabilityGrid
        days={WEEK_DAYS}
        slots={applySelectionPreview(slots, selectedSet, mode)}
        overlays={missionOverlays}
        onSelectionChange={setSelection}
      />
    </div>
  )
}
