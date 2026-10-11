import { useMemo } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import {
  buildConsultationRequestContext,
  isReusableConsultation,
} from '../../../lib/createOrder/consultation'
import { readStoredDraft } from '../../../lib/createOrder/draftStorage'
import { buildOrderPayload } from '../../../lib/createOrder/payload'
import { scoreRequest } from '../../../lib/createOrder/scoring'
import { createOrderPageMessages } from '../CreateOrderPage.messages'
import { useConsultation } from './useConsultation'
import { useCreateOrderForm } from './useCreateOrderForm'
import { useCreateOrderMeta } from './useCreateOrderMeta'
import { useDraftPersistence } from './useDraftPersistence'
import { useRecommendedService } from './useRecommendedService'
import { useSubmitOrder } from './useSubmitOrder'
import { useWizard } from './useWizard'
import { useOrderChecklist } from '../../../lib/checklist/useOrderChecklist'

/** Wires every wizard hook together; the page only renders the result. */
export function useCreateOrderWizard() {
  const { t } = useI18n(createOrderPageMessages)
  const stored = useMemo(readStoredDraft, [])
  const f = useCreateOrderForm(stored)
  const { form, step } = f
  const checklist = useOrderChecklist(form.serviceId)
  const meta = useCreateOrderMeta(
    form.serviceId,
    f.aiAnalysisRequested,
    f.setForm,
  )
  const service = meta.services.find((s) => s.id === form.serviceId)

  const chat = useConsultation({
    initialConsultation: stored?.consultation ?? null,
    initialMessages: stored?.chatMessages ?? [],
    buildContext: (latestMessage) =>
      buildConsultationRequestContext({
        form,
        mapPoint: f.mapPoint,
        services: meta.services,
        serviceName: service?.name,
        latestMessage,
      }),
    onReceive: (c) => f.applyConsultation(c, meta.services),
    onAiAnswer: f.setAiAnalysisRequested,
    onError: f.setSubmitError,
    onReset: f.resetConsultationFields,
  })

  useRecommendedService(chat.consultation, meta.services, (serviceId) => {
    f.setForm((cur) =>
      cur.serviceId === serviceId ? cur : { ...cur, serviceId },
    )
    f.setErrors((cur) => ({ ...cur, serviceId: undefined }))
  })

  const wizard = useWizard({
    step,
    setStep: f.setStep,
    form,
    setErrors: f.setErrors,
    location: {
      monitoringValid: true,
      blockedZoneNames: [],
    },
    messages: t.validation,
    canAdvance: (current) => current !== 2 || checklist.valid,
  })

  const score = useMemo(
    () => scoreRequest(form, t.scoreNotes),
    [form, t.scoreNotes],
  )
  const consultationId = isReusableConsultation(chat.consultation)
    ? chat.consultation.id
    : undefined

  const submit = useSubmitOrder({
    validate: () => wizard.validate(5) && checklist.valid,
    onTemplateChanged: checklist.markStale,
    onError: f.setSubmitError,
    buildPayload: () => ({
      ...buildOrderPayload({
        form,
        score,
        consultationId,
        aiAnalysisRequested: f.aiAnalysisRequested,
        pricingEstimate: meta.pricingEstimate,
      }),
      checklistItems: checklist.serialize(),
    }),
  })

  useDraftPersistence(
    {
      step,
      form,
      mapPoint: f.mapPoint,
      consultation: chat.consultation,
      chatMessages: chat.messages,
      autoDraft: f.autoDraft,
      aiAnalysisRequested: f.aiAnalysisRequested,
    },
    !submit.createdId,
  )

  return {
    checklist,
    f,
    meta,
    chat,
    wizard,
    submit,
    score,
    service,
    time: meta.preferredTimes.find((x) => x.id === form.preferredTimeId),
    deliverable: meta.deliverables.find(
      (d) => d.deliverableTypeId === form.deliverableTypeId,
    ),
  }
}
