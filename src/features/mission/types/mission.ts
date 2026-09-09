export type MissionStatus =
    | 'CREATED'
    | 'RESOURCE_ASSIGNING'
    | 'WAITING_OPERATOR_ACCEPTANCE'
    | 'SCHEDULED'
    | 'CONNECTED'
    | 'PREFLIGHT_CHECKING'
    | 'READY_TO_FLY'
    | 'FAILED_PREFLIGHT'
    | 'PENDING_APPROVAL'
    | 'IN_FLIGHT'
    | 'IN_PROGRESS'
    | 'RETURNING'
    | 'POSTFLIGHT_CHECKING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED'

export type DeviceStatus =
    | 'AVAILABLE'
    | 'PREFLIGHT'
    | 'ACTIVE_MISSION'
    | 'IDLE_CHARGING'
    | 'MAINTENANCE'
    | 'OFFLINE'

export type MediaType = 'IMAGE' | 'VIDEO' | 'THERMAL'

export interface Mission {
    id: string
    missionCode: string
    status: MissionStatus
    deviceId?: string
    deviceCode?: string
    operatorId?: string
    latitude: number
    longitude: number
    address?: string
    scheduledStartAt?: string
    startedAt?: string
    completedAt?: string
    description?: string
    failureReason?: string
    rejectionReason?: string
    mediaType?: MediaType
}

export interface PreflightCheck {
    id: string
    deviceCode: string
    missionId?: string
    checkedAt: string
    overallPassed: boolean
    batteryPercent: number
    batteryPassed: boolean
    gpsSatelliteCount: number
    gpsPassed: boolean
    sensorsPassed: boolean
    positioningPassed: boolean
    faultType?: 'BATTERY' | 'HARDWARE' | 'NONE'
    failureReason?: string
    flightToken?: FlightToken
    notes?: string
}

export interface FlightToken {
    id: string
    tokenValue: string
    missionId: string
    deviceCode: string
    issuedAt: string
    expiresAt: string
    usedAt?: string
    revoked: boolean
}

export interface DeviceImage {
    id: string
    missionId?: string
    deviceCode?: string
    droneId?: string
    storageKey?: string
    fileName?: string
    contentType?: string
    fileSizeBytes?: number
    capturedAt?: string
    presignedUrl?: string
}

export interface TelemetryData {
    deviceCode: string
    connected: boolean
    batteryPercent: number
    gpsSatelliteCount: number
    gpsFixType: string
    gyrometerOk: boolean
    accelerometerOk: boolean
    magnetometerOk: boolean
    localPositionOk: boolean
    globalPositionOk: boolean
    homePositionOk: boolean
    armable: boolean
    inAir: boolean
    altitude: number
    speed: number
}
