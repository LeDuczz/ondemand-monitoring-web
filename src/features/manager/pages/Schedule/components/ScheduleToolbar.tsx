import { prevWeek, nextWeek } from '../../../lib/calendarWeek'
import { formatWeekLabel } from '../scheduleHelpers'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { scheduleToolbarMessages } from './ScheduleToolbar.messages'

export function ScheduleToolbar({
  setAnchorDate,
  anchorDate,
  weekStart,
  weekEnd,
}: {
  setAnchorDate: Dispatch<SetStateAction<Date>>
  anchorDate: Date
  weekStart: Date
  weekEnd: Date
}) {
  const { t } = useI18n(scheduleToolbarMessages)
  return (
    <div className="odm-sched-topbar">
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{t.title}</h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginLeft: 'auto',
        }}
      >
        <button
          type="button"
          className="odm-btn"
          onClick={() => setAnchorDate(prevWeek(anchorDate))}
          aria-label={t.prevWeek}
        >
          ‹
        </button>
        <span style={{ fontSize: 13, minWidth: 160, textAlign: 'center' }}>
          {formatWeekLabel(weekStart, weekEnd)}
        </span>
        <button
          type="button"
          className="odm-btn"
          onClick={() => setAnchorDate(nextWeek(anchorDate))}
          aria-label={t.nextWeek}
        >
          ›
        </button>
        <button
          type="button"
          className="odm-btn"
          onClick={() => setAnchorDate(new Date())}
        >
          {t.today}
        </button>
      </div>
    </div>
  )
}
