import { Card, FormField } from '../../../../../shared/components/ui'
import { formatLocalInput } from '../createMissionHelpers'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { flightScheduleCardMessages } from './FlightScheduleCard.messages'

export function FlightScheduleCard({
  durationText,
  canFillFromCustomer,
  fillFromCustomer,
  scheduledStart,
  setScheduledStart,
  scheduledEnd,
  setScheduledEnd,
  submit,
  scopeLabel,
}: {
  durationText: string | null
  canFillFromCustomer: boolean
  fillFromCustomer: () => void
  scheduledStart: string
  setScheduledStart: Dispatch<SetStateAction<string>>
  scheduledEnd: string
  setScheduledEnd: Dispatch<SetStateAction<string>>
  submit:
    | { kind: 'idle' }
    | { kind: 'submitting' }
    | { kind: 'validationFailed'; message: string }
  scopeLabel: string
}) {
  const { t } = useI18n(flightScheduleCardMessages)
  return (
    <Card
      title={t.flightSchedule}
      actions={
        durationText ? (
          <span className="odm-plan-version">
            {t.durationLabel(durationText)}
          </span>
        ) : undefined
      }
    >
      <p className="odm-plan-field-help odm-plan-lead">
        {t.flightScheduleHint}
      </p>
      {canFillFromCustomer ? (
        <button
          type="button"
          className="odm-btn odm-plan-quickfill"
          onClick={fillFromCustomer}
        >
          {t.fillFromCustomer}
        </button>
      ) : null}
      <div className="odm-plan-form-row">
        <FormField id="mission-start" label={t.start}>
          <input
            id="mission-start"
            className="odm-inp"
            type="datetime-local"
            value={scheduledStart}
            onChange={(e) => setScheduledStart(e.target.value)}
          />
        </FormField>
        <FormField id="mission-end" label={t.end}>
          <input
            id="mission-end"
            className="odm-inp"
            type="datetime-local"
            min={scheduledStart || undefined}
            value={scheduledEnd}
            onChange={(e) => setScheduledEnd(e.target.value)}
          />
        </FormField>
      </div>
      {scheduledStart && scheduledEnd ? (
        <p className="odm-plan-summary">
          {t.scheduleSummary(
            formatLocalInput(scheduledStart),
            formatLocalInput(scheduledEnd),
          )}
        </p>
      ) : null}
      {submit.kind === 'validationFailed' && scopeLabel.trim() ? (
        <div role="alert" className="odm-or-error">
          {submit.message}
        </div>
      ) : null}
    </Card>
  )
}
