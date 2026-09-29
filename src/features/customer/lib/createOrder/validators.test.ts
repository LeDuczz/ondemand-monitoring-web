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

describe('validateStep', () => {
  it('step 1 requires an address', () => {
    expect(validateStep(1, createDefaultForm(), okLocation, msg)).toEqual({
      address: 'address',
    })
  })

  it('step 1 reports zone problems, restricted zone winning over outside zone', () => {
    const form = { ...createDefaultForm(), address: 'A' }
    expect(
      validateStep(1, form, { monitoringValid: false, blockedZoneNames: [] }, msg).address,
    ).toBe('outside')
    expect(
      validateStep(1, form, { monitoringValid: false, blockedZoneNames: ['X', 'Y'] }, msg)
        .address,
    ).toBe('blocked:X, Y')
  })

  it('step 1 rejects non-numeric coordinates', () => {
    const form = { ...createDefaultForm(), address: 'A', latitude: 'abc', longitude: 'x' }
    const errors = validateStep(1, form, okLocation, msg)
    expect(errors.latitude).toBe('latitude')
    expect(errors.longitude).toBe('longitude')
  })

  it('step 2 also requires service and title', () => {
    const errors = validateStep(2, { ...createDefaultForm(), address: 'A' }, okLocation, msg)
    expect(errors).toEqual({ serviceId: 'service', title: 'title' })
  })

  it('step 3 checks the date order, time window and deliverable', () => {
    const form = {
      ...createDefaultForm(),
      address: 'A',
      serviceId: 's',
      title: 't',
      preferredDateFrom: '2026-10-05',
      preferredDateTo: '2026-10-01',
    }
    expect(validateStep(3, form, okLocation, msg)).toEqual({
      preferredDateTo: 'order',
      preferredTimeId: 'time',
      deliverableTypeId: 'deliverable',
    })
  })

  it('step 4 passes for a complete form', () => {
    const form = {
      ...createDefaultForm(),
      address: 'A',
      serviceId: 's',
      title: 't',
      preferredTimeId: 'pt',
      deliverableTypeId: 'dt',
    }
    expect(validateStep(4, form, okLocation, msg)).toEqual({})
  })
})
