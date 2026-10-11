import { describe, expect, it } from 'vitest'

import { createDefaultForm } from './draftStorage'
import { validateStep, type ValidationMessages } from './validators'

const msg: ValidationMessages = {
  address: 'address',
  latitude: 'latitude',
  longitude: 'longitude',
  outsideZone: 'outside',
  blockedZone: (n) => `blocked:${n}`,
  serviceId: 'service',
  title: 'title',
  preferredDateFrom: 'from',
  preferredDateTo: 'to',
  preferredDateOrder: 'order',
  preferredTimeId: 'time',
  resultDeadline: 'deadline',
  recurrenceOccurrences: 'occurrences',
  deliverableTypeId: 'deliverable',
  resultFormats: 'formats',
  deliveryMethods: 'methods',
  termsAccepted: 'terms',
  altitudeM: 'altitude',
  estimatedLengthM: 'length',
  siteContactPhone: 'phone',
  permitStatus: (n) => `permit:${n}`,
  permitNumber: 'permitNumber',
}
const okLocation = { monitoringValid: true, blockedZoneNames: [] }
const withService = { ...createDefaultForm(), serviceId: 's', title: 't' }

describe('validateStep', () => {
  it('step 1 requires a service and a title', () => {
    expect(validateStep(1, createDefaultForm(), okLocation, msg)).toEqual({
      serviceId: 'service',
      title: 'title',
    })
    expect(validateStep(1, withService, okLocation, msg)).toEqual({})
  })

  it('step 2 (monitoring content) adds no field rule of its own', () => {
    expect(validateStep(2, withService, okLocation, msg)).toEqual({})
    expect(validateStep(2, createDefaultForm(), okLocation, msg)).toEqual({
      serviceId: 'service',
      title: 'title',
    })
  })

  it('step 3 requires an address', () => {
    expect(validateStep(3, withService, okLocation, msg)).toEqual({
      address: 'address',
    })
  })

  it('step 3 reports zone problems, restricted zone winning over outside zone', () => {
    const form = { ...withService, address: 'A' }
    expect(
      validateStep(3, form, { monitoringValid: false, blockedZoneNames: [] }, msg).address,
    ).toBe('outside')
    expect(
      validateStep(3, form, { monitoringValid: false, blockedZoneNames: ['X', 'Y'] }, msg)
        .address,
    ).toBe('blocked:X, Y')
  })

  it('step 3 rejects non-numeric coordinates', () => {
    const form = { ...withService, address: 'A', latitude: 'abc', longitude: 'x' }
    const errors = validateStep(3, form, okLocation, msg)
    expect(errors.latitude).toBe('latitude')
    expect(errors.longitude).toBe('longitude')
  })

  it('step 4 checks the date order and time window', () => {
    const form = {
      ...withService,
      address: 'A',
      preferredDateFrom: '2026-10-05',
      preferredDateTo: '2026-10-01',
    }
    expect(validateStep(4, form, okLocation, msg)).toEqual({
      preferredDateTo: 'order',
      preferredTimeId: 'time',
    })
  })

  it('step 5 also requires a deliverable and passes for a complete form', () => {
    const base = { ...withService, address: 'A', preferredTimeId: 'pt' }
    expect(validateStep(5, base, okLocation, msg)).toEqual({
      deliverableTypeId: 'deliverable',
      termsAccepted: 'terms',
    })
    expect(
      validateStep(5, { ...base, deliverableTypeId: 'dt', termsAccepted: true }, okLocation, msg),
    ).toEqual({})
  })

  it('step 5 requires a result format, a delivery method and accepted terms', () => {
    const base = { ...withService, address: 'A', preferredTimeId: 'pt', deliverableTypeId: 'dt' }
    expect(validateStep(5, base, okLocation, msg)).toEqual({ termsAccepted: 'terms' })
    expect(
      validateStep(
        5,
        { ...base, termsAccepted: true, resultFormats: [], deliveryMethods: [] },
        okLocation,
        msg,
      ),
    ).toEqual({ resultFormats: 'formats', deliveryMethods: 'methods' })
  })

  it('step 3 validates altitude, length and contact phone', () => {
    const form = { ...withService, address: 'A', altitudeM: 200, estimatedLengthM: '-5', siteContactPhone: 'abc' }
    expect(validateStep(3, form, okLocation, msg)).toEqual({
      altitudeM: 'altitude',
      estimatedLengthM: 'length',
      siteContactPhone: 'phone',
    })
  })

  it('step 3 requires a permit answer near the airport', () => {
    const near = { ...withService, address: 'A', latitude: '10.8150', longitude: '106.6600' }
    expect(validateStep(3, near, okLocation, msg).permitStatus).toBe('permit:Sân bay Tân Sơn Nhất')
    expect(validateStep(3, { ...near, permitStatus: 'NEED_SUPPORT' }, okLocation, msg)).toEqual({})
    expect(validateStep(3, { ...near, permitStatus: 'HAVE_PERMIT' }, okLocation, msg).permitNumber).toBe('permitNumber')
    expect(
      validateStep(3, { ...near, permitStatus: 'HAVE_PERMIT', permitNumber: 'GP-1' }, okLocation, msg),
    ).toEqual({})
  })

  it('step 4 checks the result deadline and recurrence count', () => {
    const base = { ...withService, address: 'A', preferredDateFrom: '2026-10-10', preferredDateTo: '2026-10-12', preferredTimeId: 't' }
    expect(validateStep(4, base, okLocation, msg)).toEqual({})
    expect(validateStep(4, { ...base, resultDeadline: '2026-10-11' }, okLocation, msg).resultDeadline).toBe('deadline')
    expect(validateStep(4, { ...base, resultDeadline: '2026-10-12' }, okLocation, msg).resultDeadline).toBeUndefined()
    const weekly = { ...base, recurrenceType: 'WEEKLY' as const }
    expect(validateStep(4, { ...weekly, recurrenceOccurrences: 1 }, okLocation, msg).recurrenceOccurrences).toBe('occurrences')
    expect(validateStep(4, { ...weekly, recurrenceOccurrences: 53 }, okLocation, msg).recurrenceOccurrences).toBe('occurrences')
    expect(validateStep(4, { ...weekly, recurrenceOccurrences: 4 }, okLocation, msg).recurrenceOccurrences).toBeUndefined()
    // A stale count is ignored while the request does not repeat.
    expect(validateStep(4, { ...base, recurrenceOccurrences: 1 }, okLocation, msg).recurrenceOccurrences).toBeUndefined()
  })
})
