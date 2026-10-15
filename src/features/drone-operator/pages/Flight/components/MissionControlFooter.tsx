import { useI18n } from '../../../../../shared/i18n'
import { operatorHref } from '../../../routes'
import type { Mission } from '../../../types/omss'
import { navigateOperator } from '../navigateOperator'
import { missionControlFooterMessages } from './MissionControlFooter.messages'

export function MissionControlFooter({
  mission,
  geofenceMessage,
  footerStatusColor,
  footerStatusDot,
}: {
  mission: Mission
  geofenceMessage: string
  footerStatusColor: string
  footerStatusDot: string
}) {
  const { t } = useI18n(missionControlFooterMessages)
  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '5px 18px',
        background: '#071324',
        borderTop: '1px solid rgba(59,130,246,.24)',
      }}
    >
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            window.history.back()
            return
          }
          navigateOperator(operatorHref({ screen: 'missions' }))
        }}
        style={{
          height: 28,
          padding: '0 12px',
          borderRadius: 9,
          border: '1px solid rgba(148,163,184,.2)',
          background: 'rgba(15,23,42,.72)',
          color: '#dbeafe',
          fontSize: 12,
          fontWeight: 850,
          cursor: 'pointer',
        }}
        title={t.back}
      >
        {t.backLabel}
      </button>
      {[
        {
          id: 'overview',
          label: t.overview,
          href: operatorHref({ screen: 'missions' }),
        },
        {
          id: 'missions',
          label: t.missions,
          href: operatorHref({ screen: 'missions' }),
        },
        {
          id: 'detail',
          label: t.detail,
          href: operatorHref({
            screen: 'missionDetail',
            missionId: mission.backendId ?? mission.id,
          }),
        },
        {
          id: 'gcsConnect',
          label: t.gcsConnect,
          href: operatorHref({
            screen: 'connect',
            missionId: mission.backendId ?? mission.id,
          }),
          active: true,
        },
      ].map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => navigateOperator(item.href)}
          style={{
            height: 28,
            padding: '0 12px',
            borderRadius: 9,
            border: '1px solid transparent',
            background: item.active ? 'rgba(37,99,235,.2)' : 'transparent',
            color: item.active ? '#bfdbfe' : '#94a3b8',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {item.label}
        </button>
      ))}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            color: footerStatusColor,
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          <span
            className="pulse-dot"
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: footerStatusDot,
            }}
          />
          {geofenceMessage}
        </span>
        <span
          style={{
            padding: '5px 10px',
            borderRadius: 999,
            background: 'rgba(37,99,235,.22)',
            border: '1px solid rgba(96,165,250,.28)',
            color: '#bfdbfe',
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          {t.inFlight}
        </span>
      </div>
    </footer>
  )
}
