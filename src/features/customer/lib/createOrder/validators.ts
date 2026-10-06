import type { FormErrors, FormState, Step } from './types'
import { isInsideHcmcServiceArea } from '../../../../shared/lib/serviceArea'

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

/**
 * Cumulative validation: step N also checks every earlier step.
 * Steps: 1 service + title, 2 monitoring content (validated by the checklist hook),
 * 3 location, 4 schedule, 5 deliverables.
 */
export function validateStep(
  targetStep: Step,
  form: FormState,
  location: LocationCheck,
  msg: ValidationMessages,
): FormErrors {
  const errors: FormErrors = {}

  if (targetStep >= 1) {
    if (!form.serviceId) errors.serviceId = msg.serviceId
    if (!form.title.trim()) errors.title = msg.title
  }
  if (targetStep >= 3) {
    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)
    const validLatitude = form.latitude.trim() && Number.isFinite(latitude) && Math.abs(latitude) <= 90
    const validLongitude = form.longitude.trim() && Number.isFinite(longitude) && Math.abs(longitude) <= 180
    if (!form.address.trim()) errors.address = msg.address
    if (!validLatitude) errors.latitude = msg.latitude
    if (!validLongitude) {
      errors.longitude = msg.longitude
    }
    if (
      validLatitude &&
      validLongitude &&
      !isInsideHcmcServiceArea({ latitude, longitude })
    ) {
      errors.address = msg.outsideZone
    }
    if (!location.monitoringValid) errors.address = msg.outsideZone
    if (location.blockedZoneNames.length > 0) {
      errors.address = msg.blockedZone(location.blockedZoneNames.join(', '))
    }
  }
  if (targetStep >= 4) {
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
  }
  if (targetStep >= 5) {
    if (!form.deliverableTypeId) {
      errors.deliverableTypeId = msg.deliverableTypeId
    }
  }
  return errors
}
