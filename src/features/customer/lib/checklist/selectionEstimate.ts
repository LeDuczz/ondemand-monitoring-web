import type { ServicePricePreview } from '../../../../shared/api/checklistPricingApi'
import type { ServicePricingEstimate } from '../../api/customerApi'

/** Replaces the catalog service price with the current checklist selection quote. */
export function selectionEstimate(
  estimate: ServicePricingEstimate | null,
  quote: ServicePricePreview | null,
): ServicePricingEstimate | null {
  if (!quote) return estimate

  const addOns = estimate ? estimate.totalPrice - estimate.servicePrice : 0
  return {
    serviceId: estimate?.serviceId ?? quote.serviceId,
    servicePrice: quote.total,
    additionalRequirements: estimate?.additionalRequirements ?? [],
    totalPrice: quote.total + addOns,
    quotePending: quote.quotePending,
  }
}
