import { useEffect } from 'react'

import type {
  CustomerConsultation,
  ServiceOption,
} from '../../../api/customerApi'
import { findRecommendedService } from '../../../lib/createOrder/consultation'

/** Selects the AI-recommended service once the service list is available. */
export function useRecommendedService(
  consultation: CustomerConsultation | null,
  services: ServiceOption[],
  select: (serviceId: string) => void,
) {
  const recommendedId = consultation?.recommendedServiceId
  useEffect(() => {
    if (!recommendedId || services.length === 0) return
    const match = findRecommendedService(consultation, services)
    if (match) select(match.id)
    // `consultation` only matters through its recommended id.
  }, [recommendedId, services])
}
