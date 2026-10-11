export function formatDeviceLabel(
  mission: {
    deviceId?: string | null
    deviceCode?: string | null
    droneCode?: string | null
    droneName?: string | null
  },
) {
  const code =
    mission.droneCode?.trim() ||
    mission.deviceCode?.trim() ||
    mission.deviceId?.trim() ||
    ''
  if (!code) return null

  const name = mission.droneName?.trim()
  return name && name !== code ? `${code} ${name}` : code
}
