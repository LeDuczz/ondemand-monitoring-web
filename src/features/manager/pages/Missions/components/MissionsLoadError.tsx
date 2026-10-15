import { StateView } from '../../../../../shared/components/odm/StateView'
import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { missionsLoadErrorMessages } from './MissionsLoadError.messages'

export function MissionsLoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n(missionsLoadErrorMessages)
  return (
    <Card>
      <StateView
        state="error"
        title={t.loadError}
        error={t.couldNotLoadTheMission}
        onRetry={onRetry}
      />
    </Card>
  )
}
