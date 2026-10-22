import type { MissionCalendarItem } from '../../../types/missions'
import type { PageMessages } from '../scheduleTypes'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { useState } from 'react'
import { missionsApi } from '../../../api/missionsApi'
import { planningApi } from '../../../api/planningApi'
import { ApiError } from '../../../../../shared/api/httpClient'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { managerHref } from '../../../routes'
import { useToast } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerFeedbackMessages } from '../../../feedback.messages'
import { Button } from '../../../../../shared/components/ui'

// ── ReschedulePanel ────────────────────────────────────────────────────────

export type ReschedulePanelProps = {
  mission: MissionCalendarItem
  onClose: () => void
  onRescheduled: (updated: MissionCalendarItem) => void
  t: PageMessages
  locale: 'vi-VN' | 'en-US'
}

export function ReschedulePanel({
  mission,
  onClose,
  onRescheduled,
  t,
  locale,
}: ReschedulePanelProps) {
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
  const tone = missionStatusTone[mission.status] ?? 'gray'

  const [reschedule, setReschedule] = useState(false)
  const [newStart, setNewStart] = useState(
    mission.scheduledStartAt?.slice(0, 16) ?? '',
  )
  const [newEnd, setNewEnd] = useState(
    mission.scheduledEndAt?.slice(0, 16) ?? '',
  )
  const [reason, setReason] = useState('')
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
      const plan = await planningApi.getExecutionPlan(mission.orderId)
      const updated = await missionsApi.rescheduleMission(mission.id, {
        expectedPlanRevision: plan.revision,
        scheduledStartAt: newStart + ':00+07:00',
        scheduledEndAt: newEnd + ':00+07:00',
        ...(reason.trim() ? { rescheduleReason: reason.trim() } : {}),
      })
      // Merge only the fields a reschedule changes; the response lacks
      // radiusM, mediaRequirements and flightPlan, so a full spread would wipe them.
      onRescheduled({
        ...mission,
        scheduledStartAt: updated.scheduledStartAt ?? mission.scheduledStartAt,
        scheduledEndAt: updated.scheduledEndAt ?? mission.scheduledEndAt,
        ...(updated.status ? { status: updated.status } : {}),
      })
      toast.success(fb.missionRescheduled)
    } catch (err) {
      const failure =
        err instanceof ApiError
          ? (err.message ?? t.rescheduleFailed)
          : t.unknownError
      setSaveError(failure)
      toast.error(failure)
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
        <Button
          type="button"
          style={{ flex: 'none' }}
          onClick={onClose}
          aria-label={t.closeDetail}
        >
          ✕
        </Button>
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
          <Button
            href={managerHref({
              screen: 'missionDispatch',
              missionId: mission.id,
            })}
            variant="primary" size="sm"
          >
            {t.assignResources}
          </Button>
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
          <Button
            type="button"
            onClick={() => setReschedule(true)}
          >
            {t.reschedule}
          </Button>
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
          <label style={{ fontSize: 12, color: 'var(--tx2)' }}>
            {t.rescheduleReason}
            <input
              type="text"
              className="odm-inp"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
            <Button
              type="button"
              variant="primary"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? t.saving : t.save}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setReschedule(false)
                setSaveError(null)
              }}
            >
              {t.cancel}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
