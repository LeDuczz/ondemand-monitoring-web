import { useCallback, useEffect, useState } from 'react'

import type {
  CustomerConsultation,
  ServiceOption,
} from '../../../api/customerApi'
import {
  buildDraftFromConsultation,
  findRecommendedService,
} from '../../../lib/createOrder/consultation'
import {
  createDefaultForm,
  isStep,
} from '../../../lib/createOrder/draftStorage'
import { syncAiAddonDescription } from '../../../lib/createOrder/payload'
import type {
  FormErrors,
  FormState,
  MapPoint,
  Step,
  StoredCreateOrderDraft,
} from '../../../lib/createOrder/types'

/** Wizard form state (fields, errors, step, map point) seeded from a stored draft. */
export function useCreateOrderForm(stored: StoredCreateOrderDraft | null) {
  const [step, setStep] = useState<Step>(isStep(stored?.step) ? stored.step : 1)
  const [form, setForm] = useState<FormState>(() => ({
    ...createDefaultForm(),
    ...(stored?.form ?? {}),
  }))
  const [errors, setErrors] = useState<FormErrors>({})
  const [mapPoint, setMapPoint] = useState<MapPoint>(
    stored?.mapPoint ?? { x: 50, y: 50 },
  )
  const [aiAnalysisRequested, setAiAnalysisRequested] = useState(
    Boolean(stored?.aiAnalysisRequested),
  )
  const [autoDraft, setAutoDraft] = useState(
    stored?.autoDraft ?? { title: '', description: '' },
  )
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    setForm((current) => {
      const description = syncAiAddonDescription(
        current.description,
        aiAnalysisRequested,
      )
      return description === current.description
        ? current
        : { ...current, description }
    })
  }, [aiAnalysisRequested])

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((current) => ({ ...current, [key]: value }))
      setErrors((current) => ({ ...current, [key]: undefined }))
      setSubmitError(null)
    },
    [],
  )

  /** Copies the AI draft (title/description/service) unless the user edited them. */
  const applyConsultation = useCallback(
    (consultation: CustomerConsultation, services: ServiceOption[]) => {
      const recommended = findRecommendedService(consultation, services)
      const draft = buildDraftFromConsultation(
        consultation,
        consultation.messages ?? [],
        recommended,
      )
      setForm((current) => ({
        ...current,
        serviceId: recommended?.id || current.serviceId,
        title:
          !current.title.trim() || current.title === autoDraft.title
            ? draft.title || current.title
            : current.title,
        description:
          !current.description.trim() ||
          current.description === autoDraft.description
            ? draft.description || current.description
            : current.description,
      }))
      setAutoDraft(draft)
      setErrors((current) => ({
        ...current,
        title: draft.title ? undefined : current.title,
      }))
      setSubmitError(null)
    },
    [autoDraft],
  )

  const resetConsultationFields = useCallback(() => {
    setAiAnalysisRequested(false)
    setAutoDraft({ title: '', description: '' })
    setForm((current) => ({ ...current, title: '', description: '' }))
    setErrors((current) => ({ ...current, title: undefined }))
    setSubmitError(null)
  }, [])

  return {
    step,
    setStep,
    form,
    setForm,
    errors,
    setErrors,
    mapPoint,
    setMapPoint,
    aiAnalysisRequested,
    setAiAnalysisRequested,
    autoDraft,
    submitError,
    setSubmitError,
    update,
    applyConsultation,
    resetConsultationFields,
  }
}
