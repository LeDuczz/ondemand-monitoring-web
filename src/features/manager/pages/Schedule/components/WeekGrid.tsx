import { useMemo, type CSSProperties } from 'react'

import type { MissionCalendarItem } from '../../../types/missions'
import type { PageMessages } from '../scheduleTypes'
import {
  TOTAL_HOURS,
  HOUR_START,
  PX_PER_HOUR,
  formatDateShort,
  isSameDay,
  layoutLanes,
  toLocalHours,
} from '../scheduleHelpers'
import { MissionBlock } from './MissionBlock'

// ── WeekGrid ───────────────────────────────────────────────────────────────

export type WeekGridProps = {
  days: Date[]
  missions: MissionCalendarItem[]
  selectedId: string | null
  onSelect: (m: MissionCalendarItem) => void
  t: PageMessages
  getMissionStatusLabel: (status: MissionCalendarItem['status']) => string
}

export function WeekGrid({
  days,
  missions,
  selectedId,
  onSelect,
  t,
  getMissionStatusLabel,
}: WeekGridProps) {
  const hours = useMemo(
    () => Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i),
    [],
  )
  const columns = useMemo(
    () =>
      days.map((day) =>
        layoutLanes(
          missions
            .filter(
              (m) =>
                m.scheduledStartAt &&
                isSameDay(new Date(m.scheduledStartAt), day),
            )
            .map((m) => {
              const start = toLocalHours(m.scheduledStartAt!)
              return {
                item: m,
                start,
                end: m.scheduledEndAt ? toLocalHours(m.scheduledEndAt) : start,
              }
            }),
        ),
      ),
    [days, missions],
  )
  const metrics = {
    '--sched-hours': TOTAL_HOURS,
    '--sched-hour-px': `${PX_PER_HOUR}px`,
  } as CSSProperties

  return (
    <div className="mgr-sched-scroll">
      <div
        className="mgr-sched-grid"
        style={metrics}
        aria-label={t.weekGridAriaLabel}
      >
        <div className="mgr-sched-head">
          <div className="mgr-sched-gutter" />
          {days.map((day, i) => (
            <div key={i} className="mgr-sched-day-head">
              <span className="mgr-muted">{t.shortDays[i]}</span>{' '}
              <strong>{formatDateShort(day)}</strong>
            </div>
          ))}
        </div>

        <div className="mgr-sched-body">
          <div className="mgr-sched-gutter">
            {hours.map((h) => (
              <div key={h} className="mgr-sched-hour">
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {columns.map((column, di) => (
            <div key={di} className="mgr-sched-day-col">
              {column.map(({ item, lane, lanes }) => (
                <MissionBlock
                  key={item.id}
                  mission={item}
                  lane={lane}
                  lanes={lanes}
                  selected={selectedId === item.id}
                  onSelect={onSelect}
                  missionStatusLabel={getMissionStatusLabel(item.status)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
