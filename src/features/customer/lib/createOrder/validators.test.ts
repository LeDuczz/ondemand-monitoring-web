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
  deliverableTypeId: 'deliverable',
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
    })
    expect(
      validateStep(5, { ...base, deliverableTypeId: 'dt' }, okLocation, msg),
    ).toEqual({})
  })
})
