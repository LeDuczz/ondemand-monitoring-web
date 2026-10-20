import type { ServicePricePreview } from '../../../../shared/api/checklistPricingApi'
import type { ServicePricingEstimate } from '../../api/customerApi'

/** The checklist selection quote is the whole price: checklists plus the add-ons the policy prices (for example AI analysis). */
export function selectionEstimate(
  estimate: ServicePricingEstimate | null,
  quote: ServicePricePreview | null,
): ServicePricingEstimate | null {
  if (!quote) return estimate

  return {
    serviceId: estimate?.serviceId ?? quote.serviceId,
    servicePrice: quote.checklistSubtotal,
    additionalRequirements: (quote.addOns ?? []).map((addOn) => ({
      type: addOn.key,
      description: addOn.description,
      additionalPrice: addOn.amount,
    })),
    totalPrice: quote.total,
    quotePending: quote.quotePending,
    occurrences: quote.occurrences,
  }
}
