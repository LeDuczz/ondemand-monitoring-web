export type PricingRule = {
  id?: string
  category: 'PACKAGE' | 'DISTANCE' | 'AREA' | 'CHECKLIST' | 'OUTPUT' | 'RESOURCE' | 'TERRAIN' | 'CONDITION' | 'PERMIT' | 'DISCOUNT' | 'MANAGER_ADJUSTMENT'
  calculationType: 'FIXED' | 'PERCENT_OF_BASE' | 'PER_UNIT' | 'PER_BLOCK' | 'TIERED_BLOCK' | 'MULTIPLIER' | 'RESOURCE_BASED' | 'ACTUAL_COST' | 'MANUAL_QUOTE'
  ruleKey: string
  description: string
  minValue: number | null
  maxValue: number | null
  fixedAmount: number | null
  baseAmount: number | null
  percentage: number | null
  unitSize: number | null
  multiplier: number | null
  priority: number
  enabled: boolean
}

export type PricingPolicy = {
  id: string
  name: string
  version: number
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'SUPERSEDED'
  currency: string
  effectiveFrom: string | null
  effectiveTo: string | null
  managerMaxDiscountPercent: number
  managerMaxMarkupPercent: number
  highRiskDiscountPercent: number
  minimumPriceRatio: number
  minimumPrice: number
  rules: PricingRule[]
}

export type PricingPolicyPayload = Omit<PricingPolicy, 'id' | 'version' | 'status' | 'currency'>
