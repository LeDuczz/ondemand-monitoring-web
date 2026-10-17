import type {
  MediaPricingComponent,
  PricingRule,
  PricingRounding,
} from '../types/pricing'

export const MEDIA_COMPONENTS: MediaPricingComponent[] = [
  'CHECKLIST_BASE',
  'INCLUDED_IMAGE',
  'INCLUDED_VIDEO',
  'EXTRA_IMAGE',
  'EXTRA_VIDEO',
]
export const ROUNDING_MODES: PricingRounding[] = ['CEILING', 'FLOOR', 'HALF_UP']
export const CUSTOM_PROFILE = 'GENERIC_CUSTOMER_ADDED'
const PROFILE = /^[A-Z0-9_]{1,60}$/

export const isMediaRule = (rule: PricingRule) => rule.category === 'MEDIA'
export const isTier = (rule: PricingRule) =>
  rule.mediaComponent === 'EXTRA_IMAGE' || rule.mediaComponent === 'EXTRA_VIDEO'

export type MediaRuleIssue =
  | 'PROFILE'
  | 'COMPONENT'
  | 'PRICE'
  | 'NEGATIVE'
  | 'BLOCK_SIZE'
  | 'RANGE'
  | 'OVERLAP'
  | 'GAP'
  | 'OPEN_ENDED'
  | 'ALLOWANCE'

export type MediaRuleProblem = { index: number; issue: MediaRuleIssue }

const whole = (value: number | null | undefined) =>
  value == null || Number.isInteger(value)

/**
 * Same rules the backend enforces on save, so the Admin sees the problem next to the row.
 * `index` points into the full rules array. Disabled tiers are not part of a price schedule.
 */
export function validateMediaRules(rules: PricingRule[]): MediaRuleProblem[] {
  const problems: MediaRuleProblem[] = []
  const groups = new Map<string, number[]>()
  rules.forEach((rule, index) => {
    if (!isMediaRule(rule)) return
    const add = (issue: MediaRuleIssue) => problems.push({ index, issue })
    if (
      !rule.pricingProfile ||
      !PROFILE.test(rule.pricingProfile.toUpperCase())
    )
      add('PROFILE')
    if (!rule.mediaComponent) add('COMPONENT')
    if (rule.fixedAmount == null || !whole(rule.fixedAmount)) add('PRICE')
    else if (rule.fixedAmount < 0) add('NEGATIVE')
    if (isTier(rule)) {
      if (
        rule.unitSize == null ||
        rule.unitSize < 1 ||
        !Number.isInteger(rule.unitSize)
      )
        add('BLOCK_SIZE')
      const min = rule.minValue ?? 0
      if (min < 0) add('NEGATIVE')
      if (rule.maxValue != null && rule.maxValue <= min) add('RANGE')
      if (rule.enabled)
        groups.set(`${rule.pricingProfile}:${rule.mediaComponent}`, [
          ...(groups.get(`${rule.pricingProfile}:${rule.mediaComponent}`) ??
            []),
          index,
        ])
    }
    if (
      rule.includedQuantity != null &&
      (rule.includedQuantity < 0 ||
        rule.includedQuantity > 500 ||
        !Number.isInteger(rule.includedQuantity) ||
        (rule.pricingProfile ?? '').toUpperCase() !== CUSTOM_PROFILE ||
        (rule.mediaComponent !== 'INCLUDED_IMAGE' &&
          rule.mediaComponent !== 'INCLUDED_VIDEO'))
    )
      add('ALLOWANCE')
  })
  for (const indexes of groups.values()) {
    const ordered = [...indexes].sort(
      (a, b) => (rules[a].minValue ?? 0) - (rules[b].minValue ?? 0),
    )
    let cursor = 0
    ordered.forEach((index, position) => {
      const rule = rules[index]
      const min = rule.minValue ?? 0
      if (min < cursor) problems.push({ index, issue: 'OVERLAP' })
      else if (min > cursor) problems.push({ index, issue: 'GAP' })
      if (rule.maxValue == null) {
        if (position !== ordered.length - 1)
          problems.push({ index, issue: 'OPEN_ENDED' })
      } else cursor = rule.maxValue
    })
  }
  return problems
}

export function newMediaRule(
  profile: string,
  component: MediaPricingComponent,
  existing: PricingRule[],
): PricingRule {
  const normalized = profile.trim().toUpperCase()
  const tier = component === 'EXTRA_IMAGE' || component === 'EXTRA_VIDEO'
  const siblings = existing.filter(
    (rule) =>
      isMediaRule(rule) &&
      rule.pricingProfile === normalized &&
      rule.mediaComponent === component,
  )
  // Continue the schedule where the last bounded tier ends.
  const from = tier
    ? Math.max(
        0,
        ...siblings.map((rule) => rule.maxValue ?? rule.minValue ?? 0),
      )
    : null
  let sequence = siblings.length + 1
  let ruleKey = `${normalized}:${component}:${sequence}`
  while (existing.some((rule) => rule.ruleKey === ruleKey))
    ruleKey = `${normalized}:${component}:${++sequence}`
  return {
    category: 'MEDIA',
    calculationType: tier ? 'PER_BLOCK' : 'FIXED',
    ruleKey,
    description: `${normalized} · ${component}`,
    minValue: from,
    maxValue: null,
    fixedAmount: 0,
    baseAmount: null,
    percentage: null,
    unitSize: tier ? 1 : null,
    multiplier: null,
    priority: existing.length,
    enabled: true,
    pricingProfile: normalized,
    mediaComponent: component,
    includedQuantity: null,
    roundingMode: tier ? 'CEILING' : null,
  }
}
