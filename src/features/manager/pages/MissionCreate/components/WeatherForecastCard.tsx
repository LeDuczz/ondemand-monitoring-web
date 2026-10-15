import { Card } from '../../../../../shared/components/ui'
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
    <Card
      title={t.weatherForecastTitle}
      actions={
        <span className="odm-plan-version">
          {t.weatherForecastTime(forecastTime)}
        </span>
      }
    >
      <p className="odm-plan-field-help odm-plan-lead">
        {t.weatherForecastHint}
      </p>
      {!brief.center ? (
        <div className="odm-plan-weather-empty">{t.weatherNoLocation}</div>
      ) : forecastRows.length === 0 ? (
        <div className="odm-plan-weather-empty">{t.weatherNoDates}</div>
      ) : (
        <div className="odm-plan-weather-list">
          {forecastRows.map((row) => (
            <WeatherRow key={row.date} row={row} />
          ))}
        </div>
      )}
    </Card>
  )
}
