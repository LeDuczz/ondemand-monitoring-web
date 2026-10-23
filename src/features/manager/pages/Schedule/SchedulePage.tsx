import { useCallback, useMemo, useState } from 'react'

import { ApiError } from '../../../../shared/api/httpClient'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { getMissionStatusLabel } from '../../../../shared/lib/statusTone'
import { missionsApi } from '../../api/missionsApi'
import {
  formatCalendarWeek,
  nextWeek,
  prevWeek,
  toISODate,
} from '../../lib/calendarWeek'
import { schedulePageMessages } from './SchedulePage.messages'
import type { MissionCalendarItem } from '../../types/missions'
import '../../manager.css'
import { formatWeekLabel } from './scheduleHelpers'
import { ReschedulePanel } from './components/ReschedulePanel'
import { WeekGrid } from './components/WeekGrid'
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
} from '../../../../shared/components/ui'
import '../../components/layout/mgrLayout.css'
import './schedule.css'

// ── SchedulePage ───────────────────────────────────────────────────────────

export function SchedulePage() {
  const { t, lang, locale } = useI18n(schedulePageMessages)
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

  const items = query.data?.items ?? []
  const ready = !query.loading && !query.error && !!query.data

  return (
    <div className="mgr-page" aria-label={t.pageAriaLabel}>
      <PageHeader
        title={t.title}
        subtitle={
          <>
            {formatWeekLabel(weekStart, weekEnd)}
            {ready ? ` · ${t.weekCount(items.length)}` : ''}
          </>
        }
        actions={
          <div className="mgr-sched-nav">
            <Button
              type="button"
              size="sm"
              onClick={() => setAnchorDate(prevWeek(anchorDate))}
              aria-label={t.prevWeek}
            >
              ‹
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setAnchorDate(new Date())}
            >
              {t.today}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setAnchorDate(nextWeek(anchorDate))}
              aria-label={t.nextWeek}
            >
              ›
            </Button>
          </div>
        }
      />

      <div className="mgr-legend" aria-label={t.legendTitle}>
        {(['success', 'info', 'warning', 'danger', 'neutral'] as const).map(
          (tone) => (
            <span key={tone} className="mgr-legend-item">
              <span
                className={`mgr-legend-dot is-${tone}`}
                aria-hidden="true"
              />
              {t.legend[tone]}
            </span>
          ),
        )}
      </div>

      <div className={`mgr-sched-layout${selectedMission ? ' has-panel' : ''}`}>
        <div className="mgr-detail-main">
          {query.loading && (
            <div aria-busy="true">
              <Skeleton variant="block" height={400} />
            </div>
          )}

          {!query.loading && !!query.error && (
            <Card>
              <div className="mgr-form" role="alert">
                <strong>{t.loadError}</strong>
                <span className="mgr-muted">{t.genericError}</span>
                {query.error instanceof ApiError && (
                  <code className="mgr-muted">
                    {query.error.method} /missions?from={from} ·{' '}
                    {query.error.status ?? '—'}
                  </code>
                )}
                <div>
                  <Button type="button" onClick={query.reload}>
                    {t.retry}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {ready && items.length === 0 && (
            <div className="ui-table-card">
              <EmptyState
                title={t.emptyTitle}
                description={t.emptyDescription}
                action={
                  <Button href="#portal/manager/orders">{t.backToQueue}</Button>
                }
              />
            </div>
          )}

          {ready && items.length > 0 && (
            <Card flush>
              <WeekGrid
                days={days}
                missions={items}
                selectedId={selectedMission?.id ?? null}
                onSelect={setSelectedMission}
                t={t}
                getMissionStatusLabel={(status) =>
                  getMissionStatusLabel(status, lang)
                }
              />
            </Card>
          )}
        </div>

        {selectedMission && (
          <ReschedulePanel
            key={selectedMission.id}
            mission={selectedMission}
            onClose={() => setSelectedMission(null)}
            onRescheduled={handleRescheduled}
            t={t}
            locale={locale}
          />
        )}
      </div>
    </div>
  )
}
