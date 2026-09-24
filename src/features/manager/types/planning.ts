export type DeviceTypeResponse = {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export type DeviceTypeRequest = {
  name: string
  description: string
}

export type DeviceModelResponse = {
  id: string
  name: string
  description: string
  deviceTypeId: string
  createdAt: string
  updatedAt: string
}

export type DeviceModelRequest = {
  name: string
  description: string
  deviceTypeId: string
}

export type DeviceResponse = {
  id: string
  name: string
  description: string
  deviceModelId: string
  status: string
  createdAt: string
  updatedAt: string
}

export type DeviceRequest = {
  name: string
  description: string
  deviceModelId: string
  status: string
}

export type SimulationZone = {
  id: string
  zoneCode: string
  name: string
  polygon: unknown
  createdAt: string
  updatedAt: string
}

export type SimulationZoneRequest = {
  zoneCode: string
  name: string
}

export type ZonePolygonRequest = {
  polygon: unknown
}

export type ThermalSource = {
  id: string
  name: string
  latitude: number
  longitude: number
  intensity: number
  zoneId: string | null
  createdAt: string
  updatedAt: string
}

export type ThermalSourceRequest = {
  name: string
  latitude: number
  longitude: number
  intensity: number
  zoneId?: string
}

export type PlanningGridResponse = unknown
export type PlanningMetadataResponse = unknown
export type PlanningEnvironmentSample = unknown
export type SimulationMapFeature = unknown
