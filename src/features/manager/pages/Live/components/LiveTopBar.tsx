import {
  Card,
  StatusBadge,
  toUiTone,
} from '../../../../../shared/components/ui'
import { getMissionStatusLabel } from '../../../../../shared/lib/statusTone'
import type { MissionCalendarItem } from '../../../types/missions'
import type { StatusTone } from '../../../../../shared/types/domain'
import { useI18n } from '../../../../../shared/i18n'
import { liveTopBarMessages } from './LiveTopBar.messages'

/** Selected mission header: code, title, status and crew/schedule line. */
export function LiveTopBar({
  mission,
  tone,
}: {
  mission: MissionCalendarItem
  tone: StatusTone
}) {
  const { t, lang, locale } = useI18n(liveTopBarMessages)
  return (
    <Card>
      <div className="odm-live-head">
        <div className="odm-live-head-text">
          <div className="odm-live-head-code">{mission.missionCode}</div>
          <h2 className="odm-live-head-title">
            {mission.serviceLabel ?? mission.addressText ?? '—'}
          </h2>
        </div>
        <StatusBadge tone={toUiTone(tone)}>
          {getMissionStatusLabel(mission.status, lang) ?? mission.status}
        </StatusBadge>
        <div className="odm-live-head-meta">
          {mission.droneCode}
          {mission.operatorName ? ` · ${mission.operatorName}` : ''}
          {mission.scheduledStartAt
            ? t.scheduledPrefix(
                new Date(mission.scheduledStartAt).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                new Date(mission.scheduledEndAt!).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              )
            : ''}
        </div>
      </div>
    </Card>
  )
}
