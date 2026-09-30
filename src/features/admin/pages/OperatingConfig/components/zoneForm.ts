import type { NoFlyZone, ZoneType } from '../../../types/operatingConfig'

/** Form state kept as strings so inputs stay controlled while typing. */
export type ZoneFormState = {
  name: string
  source: string
  zoneType: ZoneType
  lat: string
  lon: string
  radiusM: string
  maxAlt: string
  effectiveFrom: string
  effectiveTo: string
}

export function toFormState(zone?: NoFlyZone): ZoneFormState {
  return {
    name: zone?.name ?? '',
    source: zone?.source ?? '',
    zoneType: zone?.zoneType ?? 'RESTRICTED',
    lat: String(zone?.lat ?? 0),
    lon: String(zone?.lon ?? 0),
    radiusM: String(zone?.radiusM ?? 500),
    maxAlt: zone?.maxAltitudeM != null ? String(zone.maxAltitudeM) : '',
    effectiveFrom: zone?.effectiveFrom ?? '',
    effectiveTo: zone?.effectiveTo ?? '',
  }
}

export function toPayload(form: ZoneFormState, zone?: NoFlyZone) {
  return {
    name: form.name.trim(),
    source: form.source,
    zoneType: form.zoneType,
    lat: Number(form.lat),
    lon: Number(form.lon),
    radiusM: Number(form.radiusM),
    maxAltitudeM: form.maxAlt ? Number(form.maxAlt) : null,
    effectiveFrom: form.effectiveFrom,
    effectiveTo: form.effectiveTo || null,
    isActive: zone?.isActive ?? true,
  }
}
