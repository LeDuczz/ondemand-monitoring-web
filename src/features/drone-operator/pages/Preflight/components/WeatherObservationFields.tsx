import { useI18n } from '../../../../../shared/i18n'
import type {
  WeatherCheckStatus,
  WeatherObservationForm,
} from '../preflightTypes'
import { weatherObservationFieldsMessages } from './WeatherObservationFields.messages'
import { WeatherField } from './WeatherField'

export function WeatherObservationFields({
  form,
  onFormChange,
}: {
  form: WeatherObservationForm
  onFormChange: (form: WeatherObservationForm) => void
}) {
  const { t } = useI18n(weatherObservationFieldsMessages)
  const setField = (field: keyof WeatherObservationForm, value: string) => {
    onFormChange({ ...form, [field]: value })
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 10,
      }}
    >
      <WeatherField
        label={t.weatherSource}
        value={form.source}
        placeholder={t.weatherSourcePlaceholder}
        onChange={(value) => setField('source', value)}
        style={{ gridColumn: 'span 2' }}
      />
      <WeatherField
        label={t.weatherObservedAt}
        type="datetime-local"
        value={form.observedAt}
        onChange={(value) => setField('observedAt', value)}
        style={{ gridColumn: 'span 2' }}
      />
      <WeatherField
        label={t.weatherWind}
        value={form.windSpeedMps}
        placeholder="0.0"
        suffix="m/s"
        onChange={(value) => setField('windSpeedMps', value)}
      />
      <WeatherField
        label={t.weatherGust}
        value={form.windGustMps}
        placeholder="0.0"
        suffix="m/s"
        onChange={(value) => setField('windGustMps', value)}
      />
      <WeatherField
        label={t.weatherRain}
        value={form.precipitationMmH}
        placeholder="0.0"
        suffix="mm/h"
        onChange={(value) => setField('precipitationMmH', value)}
      />
      <WeatherField
        label={t.weatherVisibility}
        value={form.visibilityKm}
        placeholder="0.0"
        suffix="km"
        onChange={(value) => setField('visibilityKm', value)}
      />
      <WeatherField
        label={t.weatherTemperature}
        value={form.temperatureC}
        placeholder="0.0"
        suffix="°C"
        onChange={(value) => setField('temperatureC', value)}
      />
      <WeatherField
        label={t.weatherHumidity}
        value={form.humidityPercent}
        placeholder="0"
        suffix="%"
        onChange={(value) => setField('humidityPercent', value)}
      />
      <label
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          gridColumn: 'span 2',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--tx2)',
        }}
      >
        {t.weatherDecision}
        <select
          value={form.decision}
          onChange={(event) =>
            onFormChange({
              ...form,
              decision: event.target.value as WeatherCheckStatus,
            })
          }
          style={{
            height: 38,
            border: '1px solid var(--bd)',
            borderRadius: 8,
            padding: '0 10px',
            background: '#fff',
            color: 'var(--tx)',
            fontWeight: 700,
          }}
        >
          <option value="PASS">{t.weatherDecisionPass}</option>
          <option value="WARN">{t.weatherDecisionWarn}</option>
          <option value="FAIL">{t.weatherDecisionFail}</option>
        </select>
      </label>
      <WeatherField
        label={t.weatherNotes}
        value={form.notes}
        placeholder={t.weatherNotesPlaceholder}
        onChange={(value) => setField('notes', value)}
        style={{ gridColumn: 'span 4' }}
      />
    </div>
  )
}
