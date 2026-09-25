export const OPERATOR_ROOT = '#portal/drone-operator'

export type OperatorRoute =
  | { screen: 'missions' }
  | { screen: 'missionDetail'; missionId: string }
  | { screen: 'availability' }
  | { screen: 'connect'; missionId?: string }
  | { screen: 'handover'; missionId?: string }
  | { screen: 'preflight'; missionId?: string }
  | { screen: 'flight'; missionId?: string }
  | { screen: 'upload'; missionId?: string }
  | { screen: 'postflight'; missionId?: string }
  | { screen: 'maintenance' }
  | { screen: 'zoneMap' }
  | { screen: 'notifications' }
  | { screen: 'profile' }
  | { screen: 'notFound' }

export type OperatorScreen = OperatorRoute['screen']

export const OPERATOR_FLOW_SCREENS = [
  'missionDetail',
  'connect',
  'preflight',
  'handover',
  'flight',
  'upload',
  'postflight',
] as const

type OperatorFlowScreen = typeof OPERATOR_FLOW_SCREENS[number]

export function isOperatorFlowScreen(screen: OperatorScreen): screen is OperatorFlowScreen {
  return (OPERATOR_FLOW_SCREENS as readonly string[]).includes(screen)
}

export function operatorFlowStep(screen: OperatorScreen): number | null {
  const index = (OPERATOR_FLOW_SCREENS as readonly string[]).indexOf(screen)
  return index >= 0 ? index : null
}

export function operatorFlowRoute(screen: OperatorFlowScreen, missionId: string): OperatorRoute {
  if (screen === 'missionDetail') return { screen: 'missionDetail', missionId }
  return { screen, missionId } as OperatorRoute
}

export function guardOperatorFlowRoute(
  route: OperatorRoute,
  activeMissionId: string | null,
  maxStep: number,
): OperatorRoute | null {
  const step = operatorFlowStep(route.screen)
  if (step === null) return null

  if (route.screen === 'missionDetail') return null

  if (!('missionId' in route) || !route.missionId) {
    return activeMissionId ? operatorFlowRoute(route.screen as OperatorFlowScreen, activeMissionId) : { screen: 'missions' }
  }

  if (activeMissionId !== route.missionId) {
    return null
  }

  const allowedStep = Math.min(OPERATOR_FLOW_SCREENS.length - 1, maxStep + 1)
  if (step > allowedStep) {
    return operatorFlowRoute(OPERATOR_FLOW_SCREENS[allowedStep], route.missionId)
  }

  return null
}

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
      return { screen: 'connect', missionId: tail[0] }
    case 'handover':
      return { screen: 'handover', missionId: tail[0] }
    case 'preflight':
      return { screen: 'preflight', missionId: tail[0] }
    case 'flight':
      return { screen: 'flight', missionId: tail[0] }
    case 'upload':
      return { screen: 'upload', missionId: tail[0] }
    case 'postflight':
      return { screen: 'postflight', missionId: tail[0] }
    case 'maintenance':
      return { screen: 'maintenance' }
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
      return route.missionId ? `${OPERATOR_ROOT}/connect/${encodeURIComponent(route.missionId)}` : `${OPERATOR_ROOT}/connect`
    case 'handover':
      return route.missionId ? `${OPERATOR_ROOT}/handover/${encodeURIComponent(route.missionId)}` : `${OPERATOR_ROOT}/handover`
    case 'preflight':
      return route.missionId ? `${OPERATOR_ROOT}/preflight/${encodeURIComponent(route.missionId)}` : `${OPERATOR_ROOT}/preflight`
    case 'flight':
      return route.missionId ? `${OPERATOR_ROOT}/flight/${encodeURIComponent(route.missionId)}` : `${OPERATOR_ROOT}/flight`
    case 'upload':
      return route.missionId ? `${OPERATOR_ROOT}/upload/${encodeURIComponent(route.missionId)}` : `${OPERATOR_ROOT}/upload`
    case 'postflight':
      return route.missionId ? `${OPERATOR_ROOT}/postflight/${encodeURIComponent(route.missionId)}` : `${OPERATOR_ROOT}/postflight`
    case 'maintenance':
      return `${OPERATOR_ROOT}/maintenance`
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
