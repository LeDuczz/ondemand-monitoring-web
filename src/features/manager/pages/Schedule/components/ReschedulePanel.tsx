import {
  getMissionStatusLabel,
  missionStatusTone,
} from '../../../../../shared/lib/statusTone'
import { useState } from 'react'
import { missionsApi } from '../../../api/missionsApi'
import { ApiError } from '../../../../../shared/api/httpClient'
import {
  Card,
  FormField,
  StatusBadge,
  toUiTone,
} from '../../../../../shared/components/ui'
import { Icon } from '../../../../../shared/components/Icon'
import { managerHref } from '../../../routes'
import { env } from '../../../../../config/env'
import type { MissionCalendarItem } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { reschedulePanelMessages } from './ReschedulePanel.messages'

type ReschedulePanelProps = {
  mission: MissionCalendarItem
  onClose: () => void
  onRescheduled: (updated: MissionCalendarItem) => void
}

export function ReschedulePanel({
  mission,
  onClose,
  onRescheduled,
}: ReschedulePanelProps) {
  const { t, lang, locale } = useI18n(reschedulePanelMessages)

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

  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    })
  const rows: Array<{ label: string; value: string }> = [
    {
      label: t.drone,
      value: mission.droneCode
        ? `${mission.droneCode}${mission.droneName ? ` · ${mission.droneName}` : ''}`
        : t.notAssigned,
    },
    { label: t.pilot, value: mission.operatorName ?? t.notAssigned },
    {
      label: t.schedule,
      value: mission.scheduledStartAt
        ? `${time(mission.scheduledStartAt)}${mission.scheduledEndAt ? ` → ${time(mission.scheduledEndAt)}` : t.noEndTime}`
        : '—',
    },
  ]
  if (mission.addressText)
    rows.push({ label: t.location, value: mission.addressText })

  return (
    <aside role="complementary" aria-label={t.missionDetail}>
      <Card
        className="odm-or-sidepanel"
        title={<span className="odm-mono">{mission.missionCode}</span>}
        actions={
          <button
            type="button"
            className="odm-or-icon-btn"
            onClick={onClose}
            aria-label={t.closeDetail}
          >
            <Icon name="x" width={16} height={16} />
          </button>
        }
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="mng-panel-title">
            {mission.serviceLabel ?? mission.addressText ?? '—'}
          </div>

          <div className="odm-or-panel-status">
            <StatusBadge tone={toUiTone(tone)}>
              {getMissionStatusLabel(mission.status, lang)}
            </StatusBadge>
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

          <dl className="odm-or-kv">
            {rows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>

          {!reschedule ? (
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
          ) : (
            <div style={{ display: 'grid', gap: 4 }}>
              <div className="mng-panel-label">{t.rescheduleTitle}</div>
              <FormField id="resched-start" label={t.start}>
                <input
                  id="resched-start"
                  type="datetime-local"
                  className="odm-inp"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                />
              </FormField>
              <FormField
                id="resched-end"
                label={t.end}
                error={saveError ?? undefined}
              >
                <input
                  id="resched-end"
                  type="datetime-local"
                  className="odm-inp"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                />
              </FormField>
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
      </Card>
    </aside>
  )
}
