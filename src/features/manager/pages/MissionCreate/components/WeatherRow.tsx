import { suitabilityTone, type ForecastRow } from '../createMissionHelpers'
import { WeatherGlyph } from './WeatherGlyph'
import { WeatherMetrics } from './WeatherMetrics'
import { useI18n } from '../../../../../shared/i18n'
import { weatherRowMessages } from './WeatherRow.messages'

export function WeatherRow({ row }: { row: ForecastRow }) {
  const { t } = useI18n(weatherRowMessages)
  return (
    <div
      className={`odm-or-weather-row ${row.status === 'ready' ? suitabilityTone(row.forecast) : ''}`}
    >
      <div className="odm-or-weather-main">
        <div className="odm-or-weather-top">
          <div className="odm-or-weather-date">{row.label}</div>
          <span className="odm-or-weather-badge">
            {row.status === 'ready'
              ? t.weatherSuitability[row.forecast.suitability ?? 'GOOD']
              : row.status === 'loading'
                ? t.weatherChecking
                : t.weatherNotReady}
          </span>
        </div>
        {row.status === 'ready' ? (
          <>
            <div className="odm-or-weather-hero">
              <WeatherGlyph code={row.forecast.weatherCode} />
              <span className="odm-or-weather-label">
                {row.forecast.weatherLabel || t.weatherUnknown}
              </span>
            </div>
            <WeatherMetrics row={row} />
          </>
        ) : (
          <div className="odm-or-weather-desc">
            {row.status === 'loading'
              ? t.weatherLoading
              : row.status === 'unavailable'
                ? t.weatherUnavailable
                : t.weatherError}
          </div>
        )}
      </div>
    </div>
  )
}
