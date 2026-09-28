import {
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { customerApi } from '../api/customerApi'
import { customerHref } from '../routes'
import { liveHubPageMessages } from './LiveHubPage.messages'

export function LiveHubPage() {
  const { t } = useI18n(liveHubPageMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => customerApi.getDashboard(signal),
    [],
  )

  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState error={error} onRetry={reload} />

  const live = data.activeLiveMission

  return (
    <div>
      <h1 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>
        {t.title}
      </h1>

      {live ? (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#ef4444',
                color: '#fff',
                fontWeight: 700,
                fontSize: 11,
                borderRadius: 4,
                padding: '2px 8px',
              }}
            >
              {t.live}
            </span>
            <span style={{ fontWeight: 600 }}>{live.orderTitle}</span>
            <span style={{ fontSize: 12, color: 'var(--tx3)' }}>
              {live.missionCode} · {t.viewersWatching(live.viewerCount)}
            </span>
          </div>
          <a
            href={customerHref({ screen: 'live', orderId: live.orderId })}
            className="odm-btn odm-btn-p"
          >
            {t.enterLive}
          </a>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {t.noSessionTitle}
          </div>
          <div style={{ fontSize: 13, color: 'var(--tx3)' }}>
            {t.noSessionDescription}
          </div>
        </div>
      )}
    </div>
  )
}
