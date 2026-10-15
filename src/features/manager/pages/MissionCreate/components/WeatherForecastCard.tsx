import { OrderIcon } from '../../../components/common/OrderIcon'
import { type ForecastRow } from '../createMissionHelpers'
import type { OrderMissionBrief } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { weatherForecastCardMessages } from './WeatherForecastCard.messages'
import { WeatherRow } from './WeatherRow'

export function WeatherForecastCard({
  forecastTime,
  brief,
  forecastRows,
}: {
  forecastTime: string
  brief: OrderMissionBrief
  forecastRows: ForecastRow[]
}) {
  const { t } = useI18n(weatherForecastCardMessages)
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="info" size={18} />
          {t.weatherForecastTitle}
        </span>
        <span className="odm-or-pill odm-or-pill-blue">
          {t.weatherForecastTime(forecastTime)}
        </span>
      </header>
      <div className="odm-or-card-body">
        <p className="odm-or-muted odm-or-hint">{t.weatherForecastHint}</p>
        {!brief.center ? (
          <div className="odm-or-weather-empty">{t.weatherNoLocation}</div>
        ) : forecastRows.length === 0 ? (
          <div className="odm-or-weather-empty">{t.weatherNoDates}</div>
        ) : (
          <div className="odm-or-weather-list">
            {forecastRows.map((row) => (
              <WeatherRow key={row.date} row={row} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
