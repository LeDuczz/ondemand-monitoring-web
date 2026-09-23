export const OPERATOR_ROOT = '#portal/drone-operator'

export type OperatorRoute =
  | { screen: 'missions' }
  | { screen: 'missionDetail'; missionId: string }
  | { screen: 'availability' }
  | { screen: 'connect' }
  | { screen: 'handover' }
  | { screen: 'preflight' }
  | { screen: 'flight' }
  | { screen: 'upload' }
  | { screen: 'postflight' }
  | { screen: 'zoneMap' }
  | { screen: 'notifications' }
  | { screen: 'profile' }
  | { screen: 'notFound' }

export type OperatorScreen = OperatorRoute['screen']

export function parseOperatorRoute(hash: string): OperatorRoute {
  if (hash !== OPERATOR_ROOT && !hash.startsWith(`${OPERATOR_ROOT}/`)) {
    return { screen: 'missions' }
  }

  const rest = hash.slice(OPERATOR_ROOT.length)
  const segments = rest.split('/').filter(Boolean).map(decodeURIComponent)

  if (segments.length === 0) return { screen: 'missions' }

  const [head, ...tail] = segments

  switch (head) {
    case 'missions': {
      if (tail.length === 0) return { screen: 'missions' }
      return { screen: 'missionDetail', missionId: tail[0] }
    }
    case 'availability':
      return { screen: 'availability' }
    case 'connect':
      return { screen: 'connect' }
    case 'handover':
      return { screen: 'handover' }
    case 'preflight':
      return { screen: 'preflight' }
    case 'flight':
      return { screen: 'flight' }
    case 'upload':
      return { screen: 'upload' }
    case 'postflight':
      return { screen: 'postflight' }
    case 'zone-map':
      return { screen: 'zoneMap' }
    case 'notifications':
      return { screen: 'notifications' }
    case 'profile':
      return { screen: 'profile' }
    default:
      return { screen: 'notFound' }
  }
}

export function operatorHref(route: OperatorRoute): string {
  switch (route.screen) {
    case 'missions':
      return `${OPERATOR_ROOT}/missions`
    case 'missionDetail':
      return `${OPERATOR_ROOT}/missions/${route.missionId}`
    case 'availability':
      return `${OPERATOR_ROOT}/availability`
    case 'connect':
      return `${OPERATOR_ROOT}/connect`
    case 'handover':
      return `${OPERATOR_ROOT}/handover`
    case 'preflight':
      return `${OPERATOR_ROOT}/preflight`
    case 'flight':
      return `${OPERATOR_ROOT}/flight`
    case 'upload':
      return `${OPERATOR_ROOT}/upload`
    case 'postflight':
      return `${OPERATOR_ROOT}/postflight`
    case 'zoneMap':
      return `${OPERATOR_ROOT}/zone-map`
    case 'notifications':
      return `${OPERATOR_ROOT}/notifications`
    case 'profile':
      return `${OPERATOR_ROOT}/profile`
    case 'notFound':
      return OPERATOR_ROOT
  }
}
