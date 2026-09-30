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
      if (validate(o.step)) o.setStep((c) => Math.min(4, c + 1) as Step)
    },
    back: () => o.setStep((c) => Math.max(1, c - 1) as Step),
    goTo: (target: Step) => target < o.step && o.setStep(target),
  }
}
