import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { confirmStepMessages } from './ConfirmStep.messages'

export function ConfirmStep() {
  const { t } = useI18n(confirmStepMessages)
  return (
    <Card title={t.readyToAssign}>
      <div className="odm-dp-stack">
        <p className="odm-dp-help">{t.confirmBody}</p>
      </div>
    </Card>
  )
}
