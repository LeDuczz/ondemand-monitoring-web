import { useI18n } from '../../../../../shared/i18n'
import { operatorHref } from '../../../routes'
import type { ConnectState } from '../types'
import type { BackendMission } from '../../../api/liveMission'
import { ConnectionStatusCard } from './ConnectionStatusCard'
import { MissionSummaryCard } from './MissionSummaryCard'
import { connectStatusPanelMessages } from './ConnectStatusPanel.messages'

export function ConnectStatusPanel({
  state,
  error,
  mission,
}: {
  state: ConnectState
  error: string | null
  mission?: BackendMission
}) {
  const { t } = useI18n(connectStatusPanelMessages)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <MissionSummaryCard mission={mission} />

      {state === 'expired' ? (
        <div
          className="odm-card"
          style={{
            background: 'var(--red-bg)',
            borderColor: 'var(--red-dot)',
            color: 'var(--red-fg)',
          }}
        >
          <div
            className="odm-card-body"
            style={{
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {t.codeExpiredTitle}
            </div>
            <div style={{ fontSize: 12.5 }}>{t.codeExpiredBody}</div>
          </div>
        </div>
      ) : (
        <ConnectionStatusCard state={state} error={error} />
      )}

      {state === 'connected' ? (
        <a
          className="odm-btn odm-btn-p"
          href={operatorHref({ screen: 'preflight', missionId: mission?.id })}
          style={{ width: '100%' }}
        >
          {t.continueToPrecheck}
        </a>
      ) : (
        <a
          className="odm-btn"
          href={operatorHref({ screen: 'missions' })}
          style={{ width: '100%' }}
        >
          {t.backToMission}
        </a>
      )}
    </div>
  )
}
