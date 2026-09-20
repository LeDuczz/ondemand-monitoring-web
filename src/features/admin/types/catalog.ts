export type SensorType = 'RGB' | 'THERMAL' | 'ZOOM' | 'MULTISPECTRAL'

export type ServiceSensor = {
  sensor: SensorType
  isMandatory: boolean
}

export type AdminService = {
  id: string
  code: string
  name: string
  description: string
  defaultDurationMin: number
  minAltitudeM: number
  maxAltitudeM: number
  sensors: ServiceSensor[]
  isActive: boolean
}

export type TimeslotVersion = {
  id: string
  code: string
  name: string
  version: string
  startTime: string
  endTime: string
  effectiveFrom: string
  effectiveTo: string | null
}

export type AdminStation = {
  id: string
  code: string
  name: string
  address: string
  lat: number
  lon: number
  maxServiceRadiusM: number
  isActive: boolean
}

export type UpdateServicePayload = {
  name?: string
  description?: string
  defaultDurationMin?: number
  minAltitudeM?: number
  maxAltitudeM?: number
  sensors?: ServiceSensor[]
  isActive?: boolean
}

export type CreateTimeslotPayload = {
  code: string
  name: string
  startTime: string
  endTime: string
  effectiveFrom: string
}

export type CreateStationPayload = {
  code: string
  name: string
  address: string
  lat: number
  lon: number
  maxServiceRadiusM: number
}

export type UpdateStationPayload = Partial<Omit<AdminStation, 'id'>>
