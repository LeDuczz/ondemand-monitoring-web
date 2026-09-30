import type { FormErrors, FormState, Step } from './types'

export type ValidationMessages = {
  address: string
  latitude: string
  longitude: string
  outsideZone: string
  blockedZone: (zoneNames: string) => string
  serviceId: string
  title: string
  preferredDateFrom: string
  preferredDateTo: string
  preferredDateOrder: string
  preferredTimeId: string
  deliverableTypeId: string
}

export type LocationCheck = {
  monitoringValid: boolean
  blockedZoneNames: string[]
}

/** Cumulative validation: step N also checks every earlier step. */
export function validateStep(
  targetStep: Step,
  form: FormState,
  location: LocationCheck,
  msg: ValidationMessages,
): FormErrors {
  const errors: FormErrors = {}

  if (targetStep >= 1) {
    if (!form.address.trim()) errors.address = msg.address
    if (!Number.isFinite(Number(form.latitude))) errors.latitude = msg.latitude
    if (!Number.isFinite(Number(form.longitude))) {
      errors.longitude = msg.longitude
    }
    if (!location.monitoringValid) errors.address = msg.outsideZone
    if (location.blockedZoneNames.length > 0) {
      errors.address = msg.blockedZone(location.blockedZoneNames.join(', '))
    }
  }
  if (targetStep >= 2) {
    if (!form.serviceId) errors.serviceId = msg.serviceId
    if (!form.title.trim()) errors.title = msg.title
  }
  if (targetStep >= 3) {
    if (!form.preferredDateFrom) errors.preferredDateFrom = msg.preferredDateFrom
    if (!form.preferredDateTo) errors.preferredDateTo = msg.preferredDateTo
    if (
      form.preferredDateFrom &&
      form.preferredDateTo &&
      form.preferredDateFrom > form.preferredDateTo
    ) {
      errors.preferredDateTo = msg.preferredDateOrder
    }
    if (!form.preferredTimeId) errors.preferredTimeId = msg.preferredTimeId
    if (!form.deliverableTypeId) {
      errors.deliverableTypeId = msg.deliverableTypeId
    }
  }
  return errors
}
