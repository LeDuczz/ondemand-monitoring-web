import { ApiError } from '../../../../../shared/api/httpClient'
import type { MissionCalendarItem } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { telemetryErrorBannerMessages } from './TelemetryErrorBanner.messages'

export function TelemetryErrorBanner({
  telemetryError,
  mission,
  fetchLive,
}: {
  telemetryError: ApiError | null
  mission: MissionCalendarItem
  fetchLive: () => Promise<void>
}) {
  const { t } = useI18n(telemetryErrorBannerMessages)
  return (
    <>
      {telemetryError && (
        <div
          role="alert"
          style={{
            padding: '8px 16px',
            background: 'var(--red-bg)',
            color: 'var(--red-fg)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>
            {t.telemetryLost} ·{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>
              {t.getMissions}
              {mission.id}
              {t.live}
              {telemetryError.status ?? '—'}
            </code>
          </span>
          <button
            type="button"
            className="odm-btn"
            style={{ marginLeft: 'auto' }}
            onClick={fetchLive}
          >
            {t.retry}
          </button>
        </div>
      )}
    </>
  )
}
