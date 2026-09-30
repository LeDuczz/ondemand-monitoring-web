import { useCallback, useMemo, useState } from 'react'
import { env } from '../../../config/env'

import { ApiError } from '../../../shared/api/httpClient'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import {
  getMissionStatusLabel,
  missionStatusTone,
} from '../../../shared/lib/statusTone'
import { missionsApi } from '../api/missionsApi'
import {
  formatCalendarWeek,
  nextWeek,
  prevWeek,
  toISODate,
} from '../lib/calendarWeek'
import { managerHref } from '../routes'
import { schedulePageMessages } from './SchedulePage.messages'
import type { MissionCalendarItem } from '../types/missions'
import '../manager.css'

type PageMessages = (typeof schedulePageMessages)['vi']

// ── constants ──────────────────────────────────────────────────────────────

/** Hour range shown in the week grid: 06:00 – 22:00 [TK MNG-06]. */
const HOUR_START = 6
const HOUR_END = 22
const TOTAL_HOURS = HOUR_END - HOUR_START
/** Height per hour in px for the time grid. */
const PX_PER_HOUR = 60

function formatDateShort(d: Date): string {
  return String(d.getDate())
}

function formatWeekLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  return `${fmt(start)} – ${fmt(end)}`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Parses an ISO datetime string and returns local hours as a fraction (e.g. 13:30 → 13.5). */
function toLocalHours(iso: string): number {
  const d = new Date(iso)
  return d.getHours() + d.getMinutes() / 60
}

/** Tone → CSS variable suffix for mission block colours. */
const toneBg: Record<string, string> = {
  gray: 'var(--gray-bg)',
  yellow: 'var(--yellow-bg)',
  blue: 'var(--blue-bg)',
  green: 'var(--green-bg)',
  orange: 'var(--orange-bg)',
  red: 'var(--red-bg)',
}
const toneFg: Record<string, string> = {
  gray: 'var(--gray-fg)',
  yellow: 'var(--yellow-fg)',
  blue: 'var(--blue-fg)',
  green: 'var(--green-fg)',
  orange: 'var(--orange-fg)',
  red: 'var(--red-fg)',
}

// ── ReschedulePanel ────────────────────────────────────────────────────────

type ReschedulePanelProps = {
  mission: MissionCalendarItem
  onClose: () => void
  onRescheduled: (updated: MissionCalendarItem) => void
  t: PageMessages
  locale: 'vi-VN' | 'en-US'
}

function ReschedulePanel({
  mission,
  onClose,
  onRescheduled,
  t,
  locale,
}: ReschedulePanelProps) {
  const tone = missionStatusTone[mission.status] ?? 'gray'

  const [reschedule, setReschedule] = useState(false)
  const [newStart, setNewStart] = useState(
    mission.scheduledStartAt?.slice(0, 16) ?? '',
  )
  const [newEnd, setNewEnd] = useState(
    mission.scheduledEndAt?.slice(0, 16) ?? '',
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!newStart || !newEnd) {
      setSaveError(t.validationRequired)
      return
    }
    if (newStart >= newEnd) {
      setSaveError(t.validationOrder)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await missionsApi.patchSchedule(mission.id, {
        scheduledStart: newStart + ':00+07:00',
        scheduledEnd: newEnd + ':00+07:00',
      })
      onRescheduled({ ...mission, ...updated })
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message ?? t.rescheduleFailed)
      } else {
        setSaveError(t.unknownError)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="odm-sched-panel"
      role="complementary"
      aria-label={t.missionDetail}
    >
      {/* Header */}
      <div className="odm-sched-panel-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--tx3)',
            }}
          >
            {mission.missionCode}
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {mission.serviceLabel ?? mission.addressText ?? '—'}
          </div>
        </div>
        <button
          type="button"
          className="odm-btn"
          style={{ flex: 'none' }}
          onClick={onClose}
          aria-label={t.closeDetail}
        >
          ✕
        </button>
      </div>

      {/* Status badge + dispatch shortcut */}
      <div
        style={{
          padding: '8px 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <StatusBadge kind="mission" status={mission.status} tone={tone} />
        {(mission.status === 'CREATED' ||
          mission.status === 'RESOURCE_ASSIGNING') && (
          <a
            href={managerHref({
              screen: 'missionDispatch',
              missionId: mission.id,
            })}
            className="odm-btn odm-btn-p odm-btn-sm"
          >
            {t.assignResources}
          </a>
        )}
      </div>

      {/* Mission info */}
      <dl className="odm-sched-panel-dl">
        <dt>{t.drone}</dt>
        <dd>
          {mission.droneCode
            ? `${mission.droneCode}${mission.droneName ? ` · ${mission.droneName}` : ''}`
            : t.notAssigned}
        </dd>
        <dt>{t.pilot}</dt>
        <dd>{mission.operatorName ?? t.notAssigned}</dd>
        <dt>{t.schedule}</dt>
        <dd>
          {mission.scheduledStartAt
            ? `${new Date(mission.scheduledStartAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}${mission.scheduledEndAt ? ` → ${new Date(mission.scheduledEndAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}` : t.noEndTime}`
            : '—'}
        </dd>
        {mission.addressText && (
          <>
            <dt>{t.location}</dt>
            <dd>{mission.addressText}</dd>
          </>
        )}
      </dl>

      {/* Reschedule section */}
      {!reschedule ? (
        <div style={{ padding: '0 16px 16px' }}>
          <button
            type="button"
            className="odm-btn"
            disabled={!env.useMockApi && import.meta.env.MODE !== 'test'}
            title={
              !env.useMockApi && import.meta.env.MODE !== 'test'
                ? t.backendNotSupported
                : undefined
            }
            onClick={() => setReschedule(true)}
          >
            {t.reschedule}
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: '0 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {t.rescheduleTitle}
          </div>
          <label style={{ fontSize: 12, color: 'var(--tx2)' }}>
            {t.start}
            <input
              type="datetime-local"
              className="odm-inp"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              style={{ display: 'block', marginTop: 4, width: '100%' }}
            />
          </label>
          <label style={{ fontSize: 12, color: 'var(--tx2)' }}>
            {t.end}
            <input
              type="datetime-local"
              className="odm-inp"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              style={{ display: 'block', marginTop: 4, width: '100%' }}
            />
          </label>
          {saveError && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--red-fg)',
                background: 'var(--red-bg)',
                borderRadius: 6,
                padding: '6px 10px',
              }}
              role="alert"
            >
              {saveError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? t.saving : t.save}
            </button>
            <button
              type="button"
              className="odm-btn"
              onClick={() => {
                setReschedule(false)
                setSaveError(null)
              }}
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── MissionBlock ───────────────────────────────────────────────────────────

type MissionBlockProps = {
  mission: MissionCalendarItem
  dayIndex: number
  selected: boolean
  onSelect: (m: MissionCalendarItem) => void
  missionStatusLabel: string
}

function MissionBlock({
  mission,
  selected,
  onSelect,
  missionStatusLabel,
}: MissionBlockProps) {
  const startH = mission.scheduledStartAt
    ? toLocalHours(mission.scheduledStartAt)
    : HOUR_START
  const endH = mission.scheduledEndAt
    ? toLocalHours(mission.scheduledEndAt)
    : startH

  const top = Math.max(0, (startH - HOUR_START) * PX_PER_HOUR)
  const height = Math.max(18, (endH - startH) * PX_PER_HOUR - 2)

  const tone = missionStatusTone[mission.status] ?? 'gray'
  const bg = toneBg[tone]
  const fg = toneFg[tone]

  return (
    <button
      type="button"
      style={{
        position: 'absolute',
        top,
        left: 2,
        right: 2,
        height,
        background: bg,
        color: fg,
        border: selected ? `2px solid ${fg}` : '1px solid transparent',
        borderRadius: 5,
        padding: '3px 5px',
        textAlign: 'left',
        fontSize: 11,
        overflow: 'hidden',
        cursor: 'pointer',
        lineHeight: 1.3,
      }}
      onClick={() => onSelect(mission)}
      aria-pressed={selected}
      aria-label={`${mission.missionCode} ${missionStatusLabel}`}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {mission.missionCode.slice(-6)}
      </div>
      {mission.droneCode && (
        <div
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: 0.8,
          }}
        >
          {mission.droneCode}
          {mission.operatorName
            ? ` · ${mission.operatorName.split(' ').at(-1)}`
            : ''}
        </div>
      )}
    </button>
  )
}

// ── WeekGrid ───────────────────────────────────────────────────────────────

type WeekGridProps = {
  days: Date[]
  missions: MissionCalendarItem[]
  selectedId: string | null
  onSelect: (m: MissionCalendarItem) => void
  t: PageMessages
  getMissionStatusLabel: (status: MissionCalendarItem['status']) => string
}

function WeekGrid({
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

  return (
    <div className="odm-sched-grid" aria-label={t.weekGridAriaLabel}>
      {/* Header row */}
      <div className="odm-sched-grid-head">
        {/* Time gutter label */}
        <div className="odm-sched-gutter" />
        {days.map((day, i) => (
          <div key={i} className="odm-sched-day-head">
            <span style={{ color: 'var(--tx3)', fontSize: 11 }}>
              {t.shortDays[i]}
            </span>{' '}
            <span style={{ fontWeight: 600 }}>{formatDateShort(day)}</span>
          </div>
        ))}
      </div>

      {/* Body: time labels + day columns */}
      <div
        className="odm-sched-grid-body"
        style={{ height: TOTAL_HOURS * PX_PER_HOUR }}
      >
        {/* Time labels */}
        <div className="odm-sched-gutter">
          {hours.map((h) => (
            <div
              key={h}
              style={{
                height: PX_PER_HOUR,
                fontSize: 11,
                color: 'var(--tx3)',
                paddingTop: 2,
              }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, di) => {
          const dayMissions = missions.filter(
            (m) =>
              m.scheduledStartAt &&
              isSameDay(new Date(m.scheduledStartAt), day),
          )
          return (
            <div key={di} className="odm-sched-day-col">
              {/* Horizontal hour lines */}
              {hours.map((h) => (
                <div
                  key={h}
                  style={{
                    position: 'absolute',
                    top: (h - HOUR_START) * PX_PER_HOUR,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: 'var(--bd)',
                  }}
                />
              ))}
              {dayMissions.map((m) => (
                <MissionBlock
                  key={m.id}
                  mission={m}
                  dayIndex={di}
                  selected={selectedId === m.id}
                  onSelect={onSelect}
                  missionStatusLabel={getMissionStatusLabel(m.status)}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
                <button
                  type="button"
                  className="odm-btn"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={query.reload}
                >
                  {t.retry}
                </button>
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
                  <a
                    href="#portal/staff/orders"
                    className="odm-btn"
                    style={{ marginTop: 12, display: 'inline-flex' }}
                  >
                    {t.backToQueue}
                  </a>
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
