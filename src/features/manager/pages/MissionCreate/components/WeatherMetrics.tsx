import { weatherMetric } from '../createMissionHelpers'
import type { WeatherForecast } from '../../../../customer/api/customerApi'
import { useI18n } from '../../../../../shared/i18n'
import { weatherMetricsMessages } from './WeatherMetrics.messages'

export function WeatherMetrics({
  row,
}: {
  row: {
    date: string
    label: string
    status: 'ready'
    forecast: WeatherForecast
  }
}) {
  const { t } = useI18n(weatherMetricsMessages)
  return (
    <div className="odm-or-weather-metrics">
      <div className="odm-or-weather-metric">
        <span className="odm-or-weather-metric-label">
          {t.weatherTemperatureLabel}
        </span>
        <span className="odm-or-weather-metric-value">
          {weatherMetric(row.forecast.temperatureC, '°C')}
        </span>
      </div>
      <div className="odm-or-weather-metric">
        <span className="odm-or-weather-metric-label">
          {t.weatherRainLabel}
        </span>
        <span className="odm-or-weather-metric-value">
          {weatherMetric(row.forecast.precipitationProbabilityPercent, '%')}
        </span>
      </div>
      <div className="odm-or-weather-metric">
        <span className="odm-or-weather-metric-label">
          {t.weatherWindLabel}
        </span>
        <span className="odm-or-weather-metric-value">
          {weatherMetric(row.forecast.windSpeedKmh, ' km/h')}
        </span>
      </div>
      <div className="odm-or-weather-metric">
        <span className="odm-or-weather-metric-label">
          {t.weatherHumidityLabel}
        </span>
        <span className="odm-or-weather-metric-value">
          {weatherMetric(row.forecast.relativeHumidityPercent, '%')}
        </span>
      </div>
    </div>
  )
}
