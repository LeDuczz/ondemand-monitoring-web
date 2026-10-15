import { StatusBadge } from '../../../../../shared/components/ui'
import {
  formatDateTime,
  formatNumber,
} from '../../../components/common/missionDetailHelpers'
import type { WeatherPreflightCheckResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { weatherResultDetailMessages } from './WeatherResultDetail.messages'

export function WeatherResultDetail({
  weather,
}: {
  weather: WeatherPreflightCheckResponse | null
}) {
  const { t, lang, locale } = useI18n(weatherResultDetailMessages)

  if (!weather) {
    return <p className="odm-or-empty">{t.noPreFlightWeatherResult}</p>
  }
  const rows: Array<[string, string]> = [
    [t.recordedAt, formatDateTime(weather.checkedAt, locale)],
    [t.wind, formatNumber(weather.windSpeedMps, ' m/s', lang)],
    [t.gusts, formatNumber(weather.windGustMps, ' m/s', lang)],
    [t.rain, formatNumber(weather.precipitationMmH, ' mm/h', lang)],
    [t.visibility, formatNumber(weather.visibilityKm, ' km', lang)],
    [t.temperature, formatNumber(weather.temperatureC, ' °C', lang)],
    [t.humidity, formatNumber(weather.humidityPercent, '%', lang)],
  ]
  return (
    <div className="odm-md-stack">
      <div>
        <StatusBadge tone={weather.safeToFly ? 'success' : 'warning'}>
          {weather.safeToFly ? t.safeToFly : t.needsAttention}
        </StatusBadge>
      </div>
      <dl className="odm-or-kv">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="odm-md-note">{weather.summary}</p>
      {weather.advisories?.length ? (
        <ul className="odm-md-advisories">
          {weather.advisories.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
