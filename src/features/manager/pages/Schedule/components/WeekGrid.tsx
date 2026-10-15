import { MissionBlock } from './MissionBlock'
import { useMemo } from 'react'
import {
  TOTAL_HOURS,
  HOUR_START,
  LEGEND_TONES,
  formatDateShort,
  PX_PER_HOUR,
  isSameDay,
  layoutOverlaps,
} from '../scheduleHelpers'
import { Card } from '../../../../../shared/components/ui'
import type { MissionCalendarItem } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { weekGridMessages } from './WeekGrid.messages'

type WeekGridProps = {
  days: Date[]
  missions: MissionCalendarItem[]
  selectedId: string | null
  onSelect: (m: MissionCalendarItem) => void
  getMissionStatusLabel: (status: MissionCalendarItem['status']) => string
}

export function WeekGrid({
  days,
  missions,
  selectedId,
  onSelect,
  getMissionStatusLabel,
}: WeekGridProps) {
  const { t } = useI18n(weekGridMessages)
  const today = new Date()

  const hours = useMemo(
    () => Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i),
    [],
  )

  return (
    <Card flush>
      <div className="mng-cal-legend">
        <ul className="mng-legend" aria-label={t.legendAria}>
          {LEGEND_TONES.map((tone) => (
            <li key={tone} className="mng-legend-item">
              <span
                className={`mng-legend-dot is-${tone}`}
                aria-hidden="true"
              />
              {t.legend[tone]}
            </li>
          ))}
        </ul>
      </div>
      <div className="mng-cal-scroll">
        <div className="mng-cal" aria-label={t.weekGridAriaLabel}>
          <div className="mng-cal-head">
            <div className="mng-cal-gutter" />
            {days.map((day, i) => (
              <div
                key={i}
                className={`mng-cal-day-head${isSameDay(day, today) ? ' is-today' : ''}`}
              >
                <span className="mng-cal-dow">{t.shortDays[i]}</span>
                <span className="mng-cal-date">{formatDateShort(day)}</span>
              </div>
            ))}
          </div>

          <div
            className="mng-cal-body"
            style={{ height: TOTAL_HOURS * PX_PER_HOUR }}
          >
            <div className="mng-cal-gutter">
              {hours.map((h) => (
                <div
                  key={h}
                  className="mng-cal-hour"
                  style={{ height: PX_PER_HOUR }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {days.map((day, di) => {
              const dayMissions = missions.filter(
                (m) =>
                  m.scheduledStartAt &&
                  isSameDay(new Date(m.scheduledStartAt), day),
              )
              const layout = layoutOverlaps(dayMissions)
              return (
                <div
                  key={di}
                  className={`mng-cal-col${isSameDay(day, today) ? ' is-today' : ''}`}
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="mng-cal-line"
                      style={{ top: (h - HOUR_START) * PX_PER_HOUR }}
                    />
                  ))}
                  {dayMissions.map((m) => (
                    <MissionBlock
                      key={m.id}
                      mission={m}
                      selected={selectedId === m.id}
                      onSelect={onSelect}
                      missionStatusLabel={getMissionStatusLabel(m.status)}
                      lane={layout.get(m.id)?.lane}
                      lanes={layout.get(m.id)?.lanes}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}
