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
        <div role="alert" className="odm-live-alert">
          <div className="odm-live-alert-text">
            <strong>{t.telemetryLost}</strong>
            <span>{t.hint}</span>{' '}
            <code>
              {t.getMissions}
              {mission.id}
              {t.live}
              {telemetryError.status ?? '—'}
            </code>
          </div>
          <button type="button" className="odm-btn" onClick={fetchLive}>
            {t.retry}
          </button>
        </div>
      )}
    </>
  )
}
