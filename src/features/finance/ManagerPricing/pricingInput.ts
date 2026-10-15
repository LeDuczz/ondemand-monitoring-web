export type PricingDraft = {
  packagePrice: string
  discountAmount: string
  adjustmentAmount: string
  managerNote: string
  prices: Record<string, string>
}

export const emptyDraft: PricingDraft = {
  packagePrice: '0',
  discountAmount: '0',
  adjustmentAmount: '0',
  managerNote: '',
  prices: {},
}

export function amount(value: string | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isSafeInteger(parsed) ? parsed : 0
}

export function digits(value: string) {
  return value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '') || '0'
}

export function signedDigits(value: string) {
  return `${value.startsWith('-') ? '-' : ''}${digits(value)}`
}
