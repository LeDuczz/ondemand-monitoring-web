import { Card, FormField } from '../../../../../shared/components/ui'
import { Button } from '../../../../../shared/components/Button'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { planningPresentationMessages } from '../../../components/common/planningPresentation.messages'
import { planningError } from '../../../lib/planningErrors'
import { useI18n } from '../../../../../shared/i18n'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan } from '../../../types/planning'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import type { MissionResponse } from '../../../types/missions'
import { PlanStatusBadges } from './PlanStatusBadges'
import { planningContextCardMessages } from './PlanningContextCard.messages'

export function PlanningContextCard({
  onCreated,
  planQuery,
  planRevision,
  scopeLabel,
  setScopeLabel,
  submit,
  replacesMissionId,
  replacementQuery,
}: {
  onCreated: ((missionId: string) => void) | undefined
  planQuery: UseApiQueryState<ExecutionPlan>
  planRevision: number
  scopeLabel: string
  setScopeLabel: Dispatch<SetStateAction<string>>
  submit:
    | { kind: 'idle' }
    | { kind: 'submitting' }
    | { kind: 'validationFailed'; message: string }
  replacesMissionId: string | undefined
  replacementQuery: UseApiQueryState<MissionResponse | null>
}) {
  const { t } = useI18n(planningContextCardMessages)
  const { t: planningT } = useI18n(planningPresentationMessages)
  const scopeInvalid = submit.kind === 'validationFailed' && !scopeLabel.trim()
  return (
    <Card
      title={onCreated ? planningT.createTitle : planningT.title}
      actions={
        onCreated ? (
          <PlanStatusBadges
            status={planQuery.data?.planStatus}
            revision={planRevision}
            loading={planQuery.loading}
          />
        ) : undefined
      }
    >
      <div
        className="odm-plan-section"
        role="group"
        aria-label={t.missionPlanningContext}
      >
        {planQuery.error ? (
          <div role="alert" className="odm-or-error odm-plan-error">
            {planningError(planQuery.error)}{' '}
            <Button
              type="button"
              variant="secondary"
              onClick={planQuery.reload}
            >
              {planningT.retry}
            </Button>
          </div>
        ) : null}
        {planQuery.data?.planStatus === 'FINALIZED' && (
          <p className="odm-plan-notice">{planningT.finalized}</p>
        )}
        {replacesMissionId && (
          <p className="odm-plan-notice">
            {planningT.replacement(replacesMissionId)}
          </p>
        )}
        {replacementQuery.error ? (
          <p role="alert" className="odm-or-error">
            {planningError(replacementQuery.error)}
          </p>
        ) : null}
        <FormField
          id="mission-work-scope"
          label={planningT.scopeLabel}
          required
        >
          <input
            id="mission-work-scope"
            className="odm-inp"
            maxLength={255}
            required
            placeholder={planningT.scopePlaceholder}
            value={
              scopeLabel === 'Whole Order scope'
                ? planningT.scopeDefault
                : scopeLabel
            }
            onChange={(event) => setScopeLabel(event.target.value)}
            aria-describedby={`mission-scope-help${scopeInvalid ? ' mission-scope-error' : ''}`}
            aria-invalid={scopeInvalid ? true : undefined}
          />
          <p id="mission-scope-help" className="odm-plan-field-help">
            {planningT.scopeHint}
          </p>
          {scopeInvalid && submit.kind === 'validationFailed' && (
            <p id="mission-scope-error" role="alert" className="ui-field-error">
              {submit.message}
            </p>
          )}
        </FormField>
        <div className="odm-plan-scopenote">
          <h3 className="odm-plan-scopenote-title">
            <OrderIcon name="info" size={16} />
            {planningT.geography}
          </h3>
          <ul>
            <li>{planningT.geographyOrder}</li>
            <li>{planningT.geographyCustom}</li>
            <li>{planningT.geographyChecklist}</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
