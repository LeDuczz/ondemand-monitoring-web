import type { PreferredTimeOption } from '../../../api/customerApi'
import type { FormErrors, FormState, UpdateField } from '../../../lib/createOrder/types'
import { ScheduleCard } from './ScheduleCard'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  preferredTimes: PreferredTimeOption[]
}

/** Step 3: preferred dates and time window. */
export function ScheduleStep(p: Props) {
  return (
    <div className="co-grid">
      <div className="co-stack">
        <ScheduleCard form={p.form} errors={p.errors} update={p.update} preferredTimes={p.preferredTimes} />
      </div>
    </div>
  )
}
