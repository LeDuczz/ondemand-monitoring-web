import { describe, expect, it } from 'vitest'
import {
  emptyPricingForm,
  pricingToForm,
  validatePricingForm,
} from './checklistPricing'

describe('validatePricingForm', () => {
  it('accepts the neutral defaults', () => {
    expect(validatePricingForm(emptyPricingForm())).toEqual({
      ok: true,
      value: {
        basePrice: 0,
        includedImageCount: 0,
        includedVideoCount: 0,
        pricingProfile: '',
      },
    })
  })

  it('normalises the profile and keeps an explicit duration', () => {
    const result = validatePricingForm({
      basePrice: '200000',
      includedImageCount: '10',
      includedVideoCount: '1',
      standardVideoDurationSeconds: '30',
      pricingProfile: 'standard',
    })
    expect(result).toEqual({
      ok: true,
      value: {
        basePrice: 200_000,
        includedImageCount: 10,
        includedVideoCount: 1,
        standardVideoDurationSeconds: 30,
        pricingProfile: 'STANDARD',
      },
    })
  })

  it.each([
    ['basePrice', '-1'],
    ['basePrice', '1.5'],
    ['basePrice', ''],
    ['includedImageCount', '501'],
    ['includedVideoCount', '-2'],
    ['standardVideoDurationSeconds', '0'],
    ['standardVideoDurationSeconds', '7201'],
    ['pricingProfile', 'not valid'],
  ] as const)('rejects %s = %j', (field, value) => {
    const result = validatePricingForm({
      ...emptyPricingForm(),
      [field]: value,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[field]).toBe('invalid')
  })

  it('round-trips a stored checklist into the form', () => {
    expect(
      pricingToForm({
        basePrice: 5,
        includedImageCount: 2,
        includedVideoCount: 0,
        standardVideoDurationSeconds: null,
        pricingProfile: null,
      }),
    ).toEqual({
      basePrice: '5',
      includedImageCount: '2',
      includedVideoCount: '0',
      standardVideoDurationSeconds: '',
      pricingProfile: '',
    })
  })
})
