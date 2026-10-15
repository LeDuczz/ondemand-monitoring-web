import { suitabilityTone, type ForecastRow } from '../createMissionHelpers'
import { WeatherGlyph } from './WeatherGlyph'
import { WeatherMetrics } from './WeatherMetrics'
import { useI18n } from '../../../../../shared/i18n'
import { weatherRowMessages } from './WeatherRow.messages'

export function WeatherRow({ row }: { row: ForecastRow }) {
  const { t } = useI18n(weatherRowMessages)
  return (
    <div
      className={`odm-plan-weather-row ${row.status === 'ready' ? suitabilityTone(row.forecast) : ''}`}
    >
      <div className="odm-plan-weather-main">
        <div className="odm-plan-weather-top">
          <div className="odm-plan-weather-date">{row.label}</div>
          <span className="odm-plan-weather-badge">
            {row.status === 'ready'
              ? t.weatherSuitability[row.forecast.suitability ?? 'GOOD']
              : row.status === 'loading'
                ? t.weatherChecking
                : t.weatherNotReady}
          </span>
        </div>
        {row.status === 'ready' ? (
          <>
            <div className="odm-plan-weather-hero">
              <WeatherGlyph code={row.forecast.weatherCode} />
              <span className="odm-plan-weather-label">
                {row.forecast.weatherLabel || t.weatherUnknown}
              </span>
            </div>
            <WeatherMetrics row={row} />
          </>
        ) : (
          <div className="odm-plan-weather-desc">
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
