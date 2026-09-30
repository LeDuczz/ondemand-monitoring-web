import type { PreferredTimeOption, ServiceDeliverableOption } from '../../../api/customerApi'
import type { FormErrors, FormState, UpdateField } from '../../../lib/createOrder/types'
import { DeliverablesCard } from './DeliverablesCard'
import { ScheduleCard } from './ScheduleCard'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  preferredTimes: PreferredTimeOption[]
  deliverables: ServiceDeliverableOption[]
  deliverablesLoading: boolean
}

/** Step 3: preferred dates / time window and deliverables. */
export function ScheduleStep(p: Props) {
  return (
    <div className="co-grid">
      <ScheduleCard form={p.form} errors={p.errors} update={p.update} preferredTimes={p.preferredTimes} />
      <DeliverablesCard
        form={p.form}
        errors={p.errors}
        update={p.update}
        deliverables={p.deliverables}
        loading={p.deliverablesLoading}
      />
    </div>
  )
}
