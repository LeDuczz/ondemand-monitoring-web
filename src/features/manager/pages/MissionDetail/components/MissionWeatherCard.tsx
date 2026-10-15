import { Card, StatusBadge } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import {
  checkLabel,
  checkTone,
  type DetailData,
} from '../../../components/common/missionDetailHelpers'
import { WeatherResultDetail } from './WeatherResultDetail'
import { missionWeatherCardMessages } from './MissionWeatherCard.messages'

/** Recorded pre-flight weather result (sidebar). */
export function MissionWeatherCard({
  weather,
}: {
  weather: DetailData['weather']
}) {
  const { t, lang } = useI18n(missionWeatherCardMessages)
  return (
    <Card
      title={t.title}
      actions={
        weather ? (
          <StatusBadge tone={checkTone(weather.status)}>
            {checkLabel(weather.status, lang)}
          </StatusBadge>
        ) : undefined
      }
    >
      <WeatherResultDetail weather={weather} />
    </Card>
  )
}
