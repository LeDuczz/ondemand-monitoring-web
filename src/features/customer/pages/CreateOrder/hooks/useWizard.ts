import type { Dispatch, SetStateAction } from 'react'

import {
  validateStep,
  type LocationCheck,
  type ValidationMessages,
} from '../../../lib/createOrder/validators'
import type { FormErrors, FormState, Step } from '../../../lib/createOrder/types'

type Options = {
  step: Step
  setStep: Dispatch<SetStateAction<Step>>
  form: FormState
  setErrors: (errors: FormErrors) => void
  location: LocationCheck
  messages: ValidationMessages
  /** Extra gate on leaving a step (e.g. the monitoring-content list must be valid). */
  canAdvance?: (step: Step) => boolean
}

/** After a failed validation, bring the first invalid field into view and focus it. */
function revealFirstError() {
  window.setTimeout(() => {
    const error = document.querySelector('.ui-field-error')
    if (!error) return
    error.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const field = error
      .closest('.ui-form-field')
      ?.querySelector<HTMLElement>('input, select, textarea')
    field?.focus({ preventScroll: true })
  }, 50)
}

/** Step navigation: validate the current step before moving forward. */
export function useWizard(o: Options) {
  function validate(target: Step) {
    const errors = validateStep(target, o.form, o.location, o.messages)
    o.setErrors(errors)
    return Object.keys(errors).length === 0
  }

  return {
    validate,
    next: () => {
      if (validate(o.step) && (o.canAdvance?.(o.step) ?? true))
        o.setStep((c) => Math.min(5, c + 1) as Step)
      else revealFirstError()
    },
    back: () => o.setStep((c) => Math.max(1, c - 1) as Step),
    goTo: (target: Step) => target < o.step && o.setStep(target),
  }
}
