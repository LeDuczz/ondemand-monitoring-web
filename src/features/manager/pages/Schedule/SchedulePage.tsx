import { useCallback, useMemo, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { getMissionStatusLabel } from '../../../../shared/lib/statusTone'
import { missionsApi } from '../../api/missionsApi'
import { formatCalendarWeek, toISODate } from '../../lib/calendarWeek'
import { schedulePageMessages } from './SchedulePage.messages'
import type { MissionCalendarItem } from '../../types/missions'
import '../../manager.css'
import { ReschedulePanel } from './components/ReschedulePanel'
import { WeekGrid } from './components/WeekGrid'
import { ScheduleToolbar } from './components/ScheduleToolbar'
import { ScheduleSkeleton } from './components/ScheduleSkeleton'
import { ScheduleLoadError } from './components/ScheduleLoadError'
import { ScheduleEmptyState } from './components/ScheduleEmptyState'

// ── SchedulePage ───────────────────────────────────────────────────────────

export function SchedulePage() {
  const { t, lang } = useI18n(schedulePageMessages)
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const { weekStart, weekEnd, days } = useMemo(
    () => formatCalendarWeek(anchorDate),
    [anchorDate],
  )

  const [selectedMission, setSelectedMission] =
    useState<MissionCalendarItem | null>(null)

  // Invalidate when we navigate weeks so the query re-runs.
  const from = toISODate(weekStart)
  const to = toISODate(weekEnd)

  const query = useApiQuery(
    (signal) => missionsApi.listMissions({ from, to, signal }),
    [from, to],
  )

  const handleRescheduled = useCallback(
    (updated: MissionCalendarItem) => {
      // Update the selected mission in-place; a reload would also work but
      // optimistic update is faster.
      setSelectedMission(updated)
      query.reload()
    },
    [query],
  )

  return (
    <div className="odm-sched" aria-label={t.pageAriaLabel}>
      {/* Top bar */}
      <ScheduleToolbar
        setAnchorDate={setAnchorDate}
        anchorDate={anchorDate}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />

      {/* Main content + optional side panel */}
      <div
        style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        {/* Calendar area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 0 16px' }}>
          <ScheduleSkeleton query={query} />

          <ScheduleLoadError query={query} from={from} />

          {!query.loading && !query.error && query.data && (
            <>
              {query.data.items.length === 0 ? (
                <ScheduleEmptyState />
              ) : (
                <WeekGrid
                  days={days}
                  missions={query.data.items}
                  selectedId={selectedMission?.id ?? null}
                  onSelect={setSelectedMission}
                  getMissionStatusLabel={(status) =>
                    getMissionStatusLabel(status, lang)
                  }
                />
              )}
            </>
          )}
        </div>

        {/* Side panel */}
        {selectedMission && (
          <ReschedulePanel
            key={selectedMission.id}
            mission={selectedMission}
            onClose={() => setSelectedMission(null)}
            onRescheduled={handleRescheduled}
          />
        )}
      </div>
    </div>
  )
}
