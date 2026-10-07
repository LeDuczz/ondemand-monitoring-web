import { useEffect, type Dispatch, type SetStateAction } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerApi } from '../../../api/customerApi'
import type { FormState } from '../../../lib/createOrder/types'

function rethrowAbort(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') throw error
}

/**
 * Loads reference data from the BE: services + preferred times (once), the
 * deliverables of the chosen service and its pricing estimate. Keeps the form
 * pointing at valid defaults when the lists arrive.
 */
export function useCreateOrderMeta(
  serviceId: string,
  aiAnalysisRequested: boolean,
  setForm: Dispatch<SetStateAction<FormState>>,
) {
  const base = useApiQuery(
    (signal) =>
      Promise.all([
        customerApi.listServices(signal),
        customerApi.listPreferredTimes(signal),
      ]).then(([services, times]) => ({ services, times })),
    [],
  )
  const services = base.data?.services ?? []
  const preferredTimes = base.data?.times ?? []

  const deliverablesQuery = useApiQuery(
    (signal) =>
      serviceId
        ? customerApi.listServiceDeliverables(serviceId, signal)
        : Promise.resolve([]),
    [serviceId],
  )
  const deliverables = serviceId ? (deliverablesQuery.data ?? []) : []

  const pricingQuery = useApiQuery(
    (signal) =>
      serviceId
        ? customerApi
            .getPricingEstimate(serviceId, {
              aiImageAnalysis: aiAnalysisRequested,
              signal,
            })
            .catch((error) => (rethrowAbort(error), null))
        : Promise.resolve(null),
    [serviceId, aiAnalysisRequested],
  )

  useEffect(() => {
    if (!base.data) return
    setForm((current) => ({
      ...current,
      preferredTimeId: current.preferredTimeId || base.data?.times[0]?.id || '',
    }))
  }, [base.data, setForm])

  useEffect(() => {
    if (!serviceId || !deliverablesQuery.data) return
    const items = deliverablesQuery.data
    setForm((current) => {
      const valid = items.some(
        (item) => item.deliverableTypeId === current.deliverableTypeId,
      )
      return valid
        ? current
        : { ...current, deliverableTypeId: items[0]?.deliverableTypeId || '' }
    })
  }, [deliverablesQuery.data, serviceId, setForm])

  return {
    services,
    preferredTimes,
    deliverables,
    pricingEstimate: serviceId ? (pricingQuery.data ?? null) : null,
    pricingLoading: Boolean(serviceId) && pricingQuery.loading,
    deliverablesLoading: Boolean(serviceId) && deliverablesQuery.loading,
    deliverablesError: serviceId ? deliverablesQuery.error : undefined,
    reloadDeliverables: deliverablesQuery.reload,
    loading: base.loading,
    error: base.error,
    reload: base.reload,
  }
}
