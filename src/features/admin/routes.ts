// Admin (role ADMIN) client-side routing. All admin screens live under
// the `#portal/admin` hash prefix.
//
// Screen -> design code:
//  dashboard   ADM-01   accounts    ADM-02
//  createAccount ADM-03  accountDetail ADM-04

export const ADMIN_ROOT = '#portal/admin'

export type AdminRoute =
  | { screen: 'dashboard' }
  | { screen: 'accounts' }
  | { screen: 'createAccount' }
  | { screen: 'accountDetail'; accountId: string }
  | { screen: 'notFound' }

export type AdminScreen = AdminRoute['screen']

export function parseAdminRoute(hash: string): AdminRoute {
  if (hash !== ADMIN_ROOT && !hash.startsWith(`${ADMIN_ROOT}/`)) {
    return { screen: 'notFound' }
  }

  const rest = hash.slice(ADMIN_ROOT.length)
  const segments = rest.split('/').filter(Boolean).map(decodeURIComponent)

  if (segments.length === 0) return { screen: 'dashboard' }

  const [head, ...tail] = segments

  switch (head) {
    case 'accounts': {
      if (tail.length === 0) return { screen: 'accounts' }
      if (tail[0] === 'new') return { screen: 'createAccount' }
      if (tail.length === 1) return { screen: 'accountDetail', accountId: tail[0] }
      return { screen: 'notFound' }
    }
    default:
      return { screen: 'notFound' }
  }
}

export function adminHref(route: AdminRoute): string {
  switch (route.screen) {
    case 'dashboard':
      return ADMIN_ROOT
    case 'accounts':
      return `${ADMIN_ROOT}/accounts`
    case 'createAccount':
      return `${ADMIN_ROOT}/accounts/new`
    case 'accountDetail':
      return `${ADMIN_ROOT}/accounts/${route.accountId}`
    case 'notFound':
      return ADMIN_ROOT
  }
}
