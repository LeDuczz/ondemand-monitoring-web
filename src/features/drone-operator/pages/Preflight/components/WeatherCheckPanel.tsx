import { useI18n } from '../../../../../shared/i18n'
import type {
  WeatherObservationForm,
  WeatherPreflightStatus,
} from '../preflightTypes'
import { weatherCheckPanelMessages } from './WeatherCheckPanel.messages'
import { WeatherObservationFields } from './WeatherObservationFields'

export function WeatherCheckPanel({
  status,
  form,
  suggesting,
  error,
  latitude,
  longitude,
  onFormChange,
  onSuggest,
}: {
  status: WeatherPreflightStatus | null
  form: WeatherObservationForm
  suggesting: boolean
  error: string | null
  latitude?: number | null
  longitude?: number | null
  onFormChange: (form: WeatherObservationForm) => void
  onSuggest: () => void
}) {
  const { t } = useI18n(weatherCheckPanelMessages)
  const failed = status?.status === 'FAIL'
  const warned = status?.status === 'WARN'
  const passed = status?.status === 'PASS'
  const bg = failed
    ? 'var(--red-bg)'
    : warned
      ? '#fff7ed'
      : passed
        ? 'var(--green-bg)'
        : 'var(--sf)'
  const border = failed
    ? 'var(--red-dot)'
    : warned
      ? '#f59e0b'
      : passed
        ? 'var(--green-dot)'
        : 'var(--bd)'
  const fg = failed
    ? 'var(--red-fg)'
    : warned
      ? '#92400e'
      : passed
        ? 'var(--green-fg)'
        : 'var(--tx)'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        border: `1.5px solid ${border}`,
        background: bg,
        color: fg,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ fontSize: 14.5 }}>{t.weatherTitle}</strong>
          <span
            style={{
              height: 24,
              padding: '0 10px',
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              background: passed
                ? 'var(--green-solid)'
                : failed
                  ? 'var(--red-solid)'
                  : warned
                    ? '#f59e0b'
                    : 'var(--sf3)',
              color: passed || failed || warned ? '#fff' : 'var(--tx2)',
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {status ? status.status : t.weatherNotChecked}
          </span>
          {status && (
            <span style={{ fontSize: 12, color: 'inherit' }}>
              {t.weatherSummary(
                status.windSpeedMps.toFixed(1),
                status.windGustMps.toFixed(1),
                status.precipitationMmH.toFixed(1),
                status.visibilityKm.toFixed(1),
              )}
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: error ? 'var(--red-fg)' : 'var(--tx2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={error ?? status?.advisories.join(' ') ?? undefined}
        >
          {error ?? status?.summary ?? t.weatherHint}
          {status?.advisories?.[0] ? ` ${status.advisories[0]}` : ''}
        </div>
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
            {typeof latitude === 'number' && typeof longitude === 'number'
              ? t.weatherCoordinateHint(
                  latitude.toFixed(6),
                  longitude.toFixed(6),
                )
              : t.weatherNoCoordinates}
          </span>
          <button
            type="button"
            className="odm-btn"
            onClick={onSuggest}
            disabled={suggesting}
            style={{
              minWidth: 210,
              background: '#fff',
              color: 'var(--blue-dot)',
              border: '1px solid var(--blue-dot)',
            }}
          >
            {suggesting ? t.weatherSuggesting : t.weatherSuggest}
          </button>
        </div>
      </div>
      <WeatherObservationFields form={form} onFormChange={onFormChange} />
    </div>
  )
}
