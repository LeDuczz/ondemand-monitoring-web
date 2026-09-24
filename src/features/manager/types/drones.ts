import type { DroneStatus } from '../../../shared/types/domain'

export type DroneItem = {
  id: string
  code: string
  name: string | null
  serialNumber: string | null
  droneModelName: string | null
  status: DroneStatus
  baseStation: string | null
  batteryPct: number | null
  hoursSinceMaintenance: number | null
  payload: string | null
  lastSeenAt: string | null
}

export type DroneModelResponse = {
  id: string
  modelCode: string
  manufacturer: string
  category: string
  maxFlightTimeMinutes: number
  maxTakeoffWeightKg: number
  maxFlightAltitudeMeters: number
  maxWindResistanceMetersPerSecond: number
  ipRating: string
  specsMetadata: string
  createdAt: string
  updatedAt: string
  version: number
}

export type DronePayloadResponse = {
  id: string
  modelName: string
  sensorType: string
  weightKg: number
  payloadCapabilities: string
  createdAt: string
  updatedAt: string
  version: number
}

export type DroneResponse = {
  id: string
  serialNumber: string
  droneModel: DroneModelResponse
  dronePayload: DronePayloadResponse
  status: DroneStatus
  createdAt: string
  updatedAt: string
  version: number
}

export type PageResponseDroneResponse = {
  items: DroneResponse[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}

export type DroneCreateRequest = {
  serialNumber: string
  droneModelId: string
  dronePayloadId: string
  status: DroneStatus
}

export type DroneUpdateRequest = {
  serialNumber: string
  droneModelId: string
  dronePayloadId: string
  status: DroneStatus
}

export type PageResponseDroneModelResponse = {
  items: DroneModelResponse[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}

export type PageResponseDronePayloadResponse = {
  items: DronePayloadResponse[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}

export type TelemetryRequest = {
  latitude: number
  longitude: number
  altitude: number
  absoluteAltitude: number
  relativeAltitude: number
  simX: number
  simY: number
  batteryPercent: number
  speed: number
  gpsFixType: string
  gpsSatelliteCount: number
  gyrometerOk: boolean
  accelerometerOk: boolean
  magnetometerOk: boolean
  localPositionOk: boolean
  globalPositionOk: boolean
  homePositionOk: boolean
  armable: boolean
  headingDegree: number
  velocityNorth: number
  velocityEast: number
  velocityDown: number
  groundSpeed: number
  flightMode: string
  armed: boolean
  homeLatitude: number
  homeLongitude: number
  homeAbsoluteAltitude: number
  homeRelativeAltitude: number
  rollDegree: number
  pitchDegree: number
  yawDegree: number
  connected: boolean
  inAir: boolean
  geofenceConfigured: boolean
  geofencePassed: boolean
}

export type DroneTelemetryResponse = {
  id: string
  createdAt: string
  updatedAt: string
  version: number
  droneCode: string
  latitude: number
  longitude: number
  altitude: number
  absoluteAltitude: number
  relativeAltitude: number
  simX: number
  simY: number
  batteryPercent: number
  speed: number
  gpsFixType: string
  gpsSatelliteCount: number
  gyrometerOk: boolean
  accelerometerOk: boolean
  magnetometerOk: boolean
  localPositionOk: boolean
  globalPositionOk: boolean
  homePositionOk: boolean
  armable: boolean
  headingDegree: number
  velocityNorth: number
  velocityEast: number
  velocityDown: number
  groundSpeed: number
  flightMode: string
  armed: boolean
  homeLatitude: number
  homeLongitude: number
  homeAbsoluteAltitude: number
  homeRelativeAltitude: number
  rollDegree: number
  pitchDegree: number
  yawDegree: number
  connected: boolean
  inAir: boolean
  geofenceConfigured: boolean
  geofencePassed: boolean
}
