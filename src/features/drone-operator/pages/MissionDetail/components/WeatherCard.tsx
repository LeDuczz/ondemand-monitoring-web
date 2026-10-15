import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import { statusTone } from '../missionFormat'
import type { WeatherPreflightStatus } from '../types'
import { WeatherTile } from './WeatherTile'
import { weatherCardMessages } from './WeatherCard.messages'

export function WeatherCard({
  weather,
}: {
  weather: WeatherPreflightStatus | null
}) {
  const { t } = useI18n(weatherCardMessages)

  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{t.title}</div>
          {weather && (
            <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 1 }}>
              {weather.summary}
            </div>
          )}
        </div>
        <StatusBadge tone={statusTone(weather?.status)}>
          {weather
            ? weather.safeToFly
              ? t.safe
              : weather.status
            : t.notChecked}
        </StatusBadge>
      </div>
      <div className="odm-card-body" style={{ padding: '12px 14px' }}>
        {weather ? (
          <>
            <div className="mds-weather-grid">
              <WeatherTile
                label={t.windGust}
                value={`${weather.windSpeedMps.toFixed(1)} / ${weather.windGustMps.toFixed(1)} m/s`}
                icon="💨"
              />
              <WeatherTile
                label={t.rain}
                value={`${weather.precipitationMmH.toFixed(1)} mm/h`}
                icon="🌧"
              />
              <WeatherTile
                label={t.visibility}
                value={`${weather.visibilityKm.toFixed(1)} km`}
                icon="👁"
              />
              <WeatherTile
                label={t.tempHumidity}
                value={`${weather.temperatureC.toFixed(1)}°C · ${weather.humidityPercent.toFixed(0)}%`}
                icon="🌡"
              />
            </div>
            {weather.advisories.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  padding: '7px 10px',
                  borderRadius: 6,
                  background: 'var(--yellow-bg)',
                  color: 'var(--yellow-fg)',
                  fontSize: 12,
                  border: '1px solid var(--yellow-dot)',
                }}
              >
                {weather.advisories.join(' · ')}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
            {t.noResult}
          </div>
        )}
      </div>
    </div>
  )
}
