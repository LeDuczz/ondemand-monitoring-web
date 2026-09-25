export function backendPreflightTokenStorageKey(missionId: string, droneLabel: string) {
  return `omss.droneOperator.backendPreflightToken.${missionId}.${droneLabel}`
}

export function preflightReadyStorageKey(missionIdOrCode: string, droneLabel: string) {
  return `omss.droneOperator.preflightReady.${missionIdOrCode}.${droneLabel}`
}
