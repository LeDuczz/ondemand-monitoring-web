import { Card } from '../../../../../shared/components/ui'
import type { DispatchStep } from '../liveDispatchHelpers'
import { useI18n } from '../../../../../shared/i18n'
import { resourcesCheckingMessages } from './ResourcesChecking.messages'

export function ResourcesChecking({
  activeStep,
}: {
  activeStep: DispatchStep
}) {
  const { t } = useI18n(resourcesCheckingMessages)
  return (
    <Card>
      <p className="odm-dp-help" role="status">
        {activeStep === 'device' ? t.checkingDevices : t.checkingStaff}
      </p>
    </Card>
  )
}
