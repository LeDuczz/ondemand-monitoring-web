import { Card, FormField } from '../../../../../shared/components/ui'
import { type ForecastRow } from '../createMissionHelpers'
import type { OrderMissionBrief } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { weatherForecastCardMessages } from './WeatherForecastCard.messages'
import { WeatherRow } from './WeatherRow'

export function WeatherForecastCard({
  forecastTime,
  brief,
  forecastRows,
  checkControls,
}: {
  forecastTime: string
  brief: OrderMissionBrief
  forecastRows: ForecastRow[]
  /** Embedded in Order planning: the manager picks any day/time to check. */
  checkControls?: {
    date: string
    time: string
    onDateChange: (value: string) => void
    onTimeChange: (value: string) => void
  }
}) {
  const { t } = useI18n(weatherForecastCardMessages)
  return (
    <Card
      title={checkControls ? t.weatherCheckTitle : t.weatherForecastTitle}
      actions={
        <span className="odm-plan-version">
          {t.weatherForecastTime(forecastTime)}
        </span>
      }
    >
      <p className="odm-plan-field-help odm-plan-lead">
        {checkControls ? t.weatherCheckHint : t.weatherForecastHint}
      </p>
      {checkControls ? (
        <div className="odm-plan-form-row">
          <FormField id="weather-check-date" label={t.checkDate}>
            <input
              id="weather-check-date"
              className="odm-inp"
              type="date"
              value={checkControls.date}
              onChange={(event) =>
                checkControls.onDateChange(event.target.value)
              }
            />
          </FormField>
          <FormField id="weather-check-time" label={t.checkTime}>
            <input
              id="weather-check-time"
              className="odm-inp"
              type="time"
              value={checkControls.time}
              onChange={(event) =>
                checkControls.onTimeChange(event.target.value)
              }
            />
          </FormField>
        </div>
      ) : null}
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
