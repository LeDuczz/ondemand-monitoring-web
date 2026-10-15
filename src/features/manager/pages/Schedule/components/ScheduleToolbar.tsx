import { prevWeek, nextWeek } from '../../../lib/calendarWeek'
import { formatWeekLabel } from '../scheduleHelpers'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { Icon } from '../../../../../shared/components/Icon'
import { PageHeader } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { scheduleToolbarMessages } from './ScheduleToolbar.messages'

/** Page header with compact week navigation (prev, today, next). */
export function ScheduleToolbar({
  setAnchorDate,
  anchorDate,
  weekStart,
  weekEnd,
  count,
}: {
  setAnchorDate: Dispatch<SetStateAction<Date>>
  anchorDate: Date
  weekStart: Date
  weekEnd: Date
  count?: ReactNode
}) {
  const { t } = useI18n(scheduleToolbarMessages)
  const week = formatWeekLabel(weekStart, weekEnd)
  return (
    <PageHeader
      title={t.title}
      subtitle={count ? `${week} · ${count}` : week}
      actions={
        <div className="mng-week-nav" role="group" aria-label={t.weekNav}>
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            onClick={() => setAnchorDate(prevWeek(anchorDate))}
            aria-label={t.prevWeek}
          >
            <Icon name="arrow-left" width={14} height={14} />
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            onClick={() => setAnchorDate(new Date())}
          >
            {t.today}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            onClick={() => setAnchorDate(nextWeek(anchorDate))}
            aria-label={t.nextWeek}
          >
            <Icon name="arrow-right" width={14} height={14} />
          </button>
        </div>
      }
    />
  )
}
