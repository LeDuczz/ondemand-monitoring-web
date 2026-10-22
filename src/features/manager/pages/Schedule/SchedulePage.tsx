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
import { Button } from '../../../../shared/components/ui'

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

  return (
    <div className="odm-sched" aria-label={t.pageAriaLabel}>
      {/* Top bar */}
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
          <Button
            type="button"
            onClick={() => setAnchorDate(prevWeek(anchorDate))}
            aria-label={t.prevWeek}
          >
            ‹
          </Button>
          <span style={{ fontSize: 13, minWidth: 160, textAlign: 'center' }}>
            {formatWeekLabel(weekStart, weekEnd)}
          </span>
          <Button
            type="button"
            onClick={() => setAnchorDate(nextWeek(anchorDate))}
            aria-label={t.nextWeek}
          >
            ›
          </Button>
          <Button
            type="button"
            onClick={() => setAnchorDate(new Date())}
          >
            {t.today}
          </Button>
        </div>
      </div>

      {/* Main content + optional side panel */}
      <div
        style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        {/* Calendar area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 0 16px' }}>
          {query.loading && (
            <div
              style={{ padding: 40, textAlign: 'center', color: 'var(--tx3)' }}
              aria-busy="true"
            >
              <div
                className="odm-sk"
                style={{ height: 400, borderRadius: 8, margin: '0 16px' }}
              />
            </div>
          )}

          {!query.loading && !!query.error && (
            <div style={{ padding: 24 }}>
              <div
                className="odm-card"
                style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
                role="alert"
              >
                <div style={{ fontWeight: 600, color: 'var(--red-fg)' }}>
                  {t.loadError}
                </div>
                <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
                  {t.genericError}
                </div>
                {query.error instanceof ApiError && (
                  <code
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--tx3)',
                    }}
                  >
                    {query.error.method} /missions?from={from} ·{' '}
                    {query.error.status ?? '—'}
                  </code>
                )}
                <Button
                  type="button"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={query.reload}
                >
                  {t.retry}
                </Button>
              </div>
            </div>
          )}

          {!query.loading && !query.error && query.data && (
            <>
              {query.data.items.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--tx3)',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                  <div style={{ fontWeight: 600 }}>{t.emptyTitle}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {t.emptyDescription}
                  </div>
                  <Button
                    href="#portal/manager/orders"
                    style={{ marginTop: 12, display: 'inline-flex' }}
                  >
                    {t.backToQueue}
                  </Button>
                </div>
              ) : (
                <WeekGrid
                  days={days}
                  missions={query.data.items}
                  selectedId={selectedMission?.id ?? null}
                  onSelect={setSelectedMission}
                  t={t}
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
            t={t}
            locale={locale}
          />
        )}
      </div>
    </div>
  )
}
