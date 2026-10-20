import { useI18n } from '../../../../../shared/i18n'
import { missionNextStepMessages } from './MissionNextStep.messages'

/** Plain-language "what is happening / what is next" for the manager, by Mission status. */
export function MissionNextStep({
  status,
  accepted,
  crew,
}: {
  status: string
  accepted: number
  crew: number
}) {
  const { t } = useI18n(missionNextStepMessages)
  const step = t.steps[status]
  if (!step) return null
  const detail =
    status === 'WAITING_CREW_CONFIRMATION' ||
    status === 'WAITING_OPERATOR_ACCEPTANCE'
      ? crew > 0
        ? t.crewProgress(accepted, crew)
        : t.crewWaiting
      : step.detail
  return (
    <div className={`odm-md-next is-${step.tone}`} role="status">
      <strong>{step.title}</strong>
      <span>{detail}</span>
    </div>
  )
}
