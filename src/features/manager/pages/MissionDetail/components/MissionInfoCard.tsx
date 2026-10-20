import { formatOrderCode } from '../../../components/common/format'
import { formatDateTime } from '../../../components/common/missionDetailHelpers'
import { Card } from '../../../../../shared/components/ui'
import type { MissionResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { missionInfoCardMessages } from './MissionInfoCard.messages'

export function MissionInfoCard({
  mission,
  startedAt,
  completedAt,
}: {
  mission: MissionResponse
  startedAt: string | null
  completedAt: string | null
}) {
  const { t, locale } = useI18n(missionInfoCardMessages)
  const rows: Array<{ label: string; value: string }> = [
    {
      label: t.fields.order,
      value: mission.orderCode ? formatOrderCode(mission.orderCode) : '—',
    },
    { label: t.fields.service, value: mission.serviceName ?? '—' },
    {
      label: t.fields.scheduledStart,
      value: formatDateTime(mission.scheduledStartAt, locale),
    },
    {
      label: t.fields.scheduledEnd,
      value: formatDateTime(mission.scheduledEndAt ?? null, locale),
    },
    {
      label: t.fields.started,
      value: startedAt ? formatDateTime(startedAt, locale) : t.notRecorded,
    },
    {
      label: t.fields.completed,
      value: completedAt ? formatDateTime(completedAt, locale) : t.notRecorded,
    },
    { label: t.fields.address, value: mission.address ?? '—' },
    {
      label: t.fields.coordinates,
      value:
        mission.latitude != null && mission.longitude != null
          ? `${mission.latitude}, ${mission.longitude}`
          : '—',
    },
    {
      label: t.fields.mediaType,
      value: mission.mediaSummary ?? mission.mediaType ?? '—',
    },
  ]
  const note =
    mission.description && mission.description.trim().length > 2
      ? mission.description.trim()
      : null
  const failure = mission.failureReason ?? mission.rejectionReason
  if (failure) rows.push({ label: t.fields.failure, value: failure })

  return (
    <Card title={t.infoCard}>
      <dl className="odm-or-kv">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="odm-md-note">{note}</p> : null}
    </Card>
  )
}
