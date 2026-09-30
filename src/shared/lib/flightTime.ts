// Implements the flight-time-required formula from
// [BRIEF C1 "Công thức thời gian bay yêu cầu"]:
//
//   distance_m = haversine(base, order.center)
//   T_travel   = 2 × distance_m / cruise_speed_ms
//   T_orbit    = (2π × radius_m) / cruise_speed_ms     -- only if plan_type = ORBIT
//   T_video    = Σ duration_sec (media_type = VIDEO)
//   T_photo    = Σ quantity × PHOTO_INTERVAL_SEC
//   T_stream   = Σ duration_sec (media_type = LIVESTREAM)
//   T_capture  = max(T_orbit, T_video + T_photo + T_stream)
//   T_required = T_travel + T_capture
//   T_limit    = max_flight_time_min × 60 × (1 − FLIGHT_TIME_BUFFER_PCT/100)
//   feasible   = T_required <= T_limit
//   endurance_margin = 1 − T_required / T_limit

export type GeoPoint = {
  lat: number
  lon: number
}

export type PlanType = 'ORBIT' | 'GRID' | 'POINT'

export type FlightTimeInput = {
  base: GeoPoint
  center: GeoPoint
  planType: PlanType
  /** Orbit radius in metres; required (and only used) when `planType === 'ORBIT'`. */
  radiusM?: number
  /** Drone model cruise speed, m/s. */
  cruiseSpeedMs: number
  /** Total seconds of VIDEO capture requested. */
  videoDurationSec: number
  /** Total number of photos requested. */
  photoQuantity: number
  /** Seconds between photo shots (policy.PHOTO_INTERVAL_SEC). */
  photoIntervalSec: number
  /** Total seconds of LIVESTREAM capture requested. */
  streamDurationSec: number
  /** Drone model max flight time, minutes. */
  maxFlightTimeMin: number
  /** policy.FLIGHT_TIME_BUFFER_PCT, 0-100. */
  flightTimeBufferPct: number
}

export type FlightTimeResult = {
  distanceM: number
  tTravelSec: number
  tOrbitSec: number
  tVideoSec: number
  tPhotoSec: number
  tStreamSec: number
  tCaptureSec: number
  tRequiredSec: number
  tLimitSec: number
  feasible: boolean
  enduranceMargin: number
}

const EARTH_RADIUS_M = 6_371_000

function toRadians(deg: number) {
  return (deg * Math.PI) / 180
}

/** Great-circle distance between two lat/lon points, in metres. */
export function haversineDistanceM(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLon = toRadians(b.lon - a.lon)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return EARTH_RADIUS_M * c
}

export function estimateFlightTime(input: FlightTimeInput): FlightTimeResult {
  const distanceM = haversineDistanceM(input.base, input.center)
  const tTravelSec = (2 * distanceM) / input.cruiseSpeedMs

  const tOrbitSec =
    input.planType === 'ORBIT' && input.radiusM
      ? (2 * Math.PI * input.radiusM) / input.cruiseSpeedMs
      : 0

  const tVideoSec = input.videoDurationSec
  const tPhotoSec = input.photoQuantity * input.photoIntervalSec
  const tStreamSec = input.streamDurationSec

  const tCaptureSec = Math.max(tOrbitSec, tVideoSec + tPhotoSec + tStreamSec)
  const tRequiredSec = tTravelSec + tCaptureSec

  const tLimitSec =
    input.maxFlightTimeMin * 60 * (1 - input.flightTimeBufferPct / 100)

  const feasible = tRequiredSec <= tLimitSec
  const enduranceMargin =
    tLimitSec > 0 ? 1 - tRequiredSec / tLimitSec : -Infinity

  return {
    distanceM,
    tTravelSec,
    tOrbitSec,
    tVideoSec,
    tPhotoSec,
    tStreamSec,
    tCaptureSec,
    tRequiredSec,
    tLimitSec,
    feasible,
    enduranceMargin,
  }
}
