import { useI18n } from '../../../../../shared/i18n'
import { operatorHref } from '../../../routes'
import type { OperatorProfile } from '../../../types/mission'
import { missionListHeaderMessages } from './MissionListHeader.messages'

type Messages = (typeof missionListHeaderMessages)['vi']

function headerDateLabel(now: Date, t: Messages): string {
  const weekday = t.weekdays[now.getDay()]
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${weekday}, ${dd}/${mm}/${now.getFullYear()} · ${hh}:${min}`
}

export function MissionListHeader({
  profile,
  now,
}: {
  profile: OperatorProfile
  now: Date
}) {
  const { t } = useI18n(missionListHeaderMessages)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '-.01em',
          }}
        >
          {t.title}
        </h1>
        <div style={{ color: 'var(--tx3)', fontSize: 12.5, marginTop: 3 }}>
          {profile.fullName}
          {profile.rank ? t.pilotRank(profile.rank) : ''} ·{' '}
          {headerDateLabel(now, t)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <a className="odm-btn" href={operatorHref({ screen: 'availability' })}>
          {t.declareAvailability}
        </a>
        <a className="odm-btn" href={operatorHref({ screen: 'maintenance' })}>
          {t.manageMaintenance}
        </a>
      </div>
    </div>
  )
}
