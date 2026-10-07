import type { FormErrors, FormState, Step } from './types'
import { isInsideHcmcServiceArea } from '../../../../shared/lib/serviceArea'
import { findPermitZone } from './airspace'

export const ALTITUDE_MIN = 10
export const ALTITUDE_MAX = 120
const LENGTH_MAX = 100_000
const PHONE_PATTERN = /^[+0-9 ().-]{8,20}$/

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
  resultDeadline: string
  recurrenceOccurrences: string
  deliverableTypeId: string
  resultFormats: string
  deliveryMethods: string
  termsAccepted: string
  altitudeM: string
  estimatedLengthM: string
  siteContactPhone: string
  permitStatus: (zoneName: string) => string
  permitNumber: string
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
    if (
      !Number.isFinite(form.altitudeM) ||
      form.altitudeM < ALTITUDE_MIN ||
      form.altitudeM > ALTITUDE_MAX
    ) {
      errors.altitudeM = msg.altitudeM
    }
    const length = form.estimatedLengthM.trim()
    if (length && !(Number(length) > 0 && Number(length) <= LENGTH_MAX)) {
      errors.estimatedLengthM = msg.estimatedLengthM
    }
    const phone = form.siteContactPhone.trim()
    if (phone && !PHONE_PATTERN.test(phone)) errors.siteContactPhone = msg.siteContactPhone
    if (validLatitude && validLongitude) {
      const zone = findPermitZone({ latitude, longitude }, form.radiusM)
      if (zone) {
        if (form.permitStatus === 'NONE') {
          errors.permitStatus = msg.permitStatus(zone.name)
        } else if (form.permitStatus === 'HAVE_PERMIT' && !form.permitNumber.trim()) {
          errors.permitNumber = msg.permitNumber
        }
      }
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
    if (
      form.resultDeadline &&
      form.preferredDateTo &&
      form.resultDeadline < form.preferredDateTo
    ) {
      errors.resultDeadline = msg.resultDeadline
    }
    if (
      form.recurrenceType !== 'NONE' &&
      !(
        Number.isInteger(form.recurrenceOccurrences) &&
        form.recurrenceOccurrences >= 2 &&
        form.recurrenceOccurrences <= 52
      )
    ) {
      errors.recurrenceOccurrences = msg.recurrenceOccurrences
    }
  }
  if (targetStep >= 5) {
    if (!form.deliverableTypeId) {
      errors.deliverableTypeId = msg.deliverableTypeId
    }
    if (form.resultFormats.length === 0) errors.resultFormats = msg.resultFormats
    if (form.deliveryMethods.length === 0) errors.deliveryMethods = msg.deliveryMethods
    if (!form.termsAccepted) errors.termsAccepted = msg.termsAccepted
  }
  return errors
}
