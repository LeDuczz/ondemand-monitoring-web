export const CUSTOMER_ROOT = '#portal/customer'

export type CustomerRoute =
  | { screen: 'dashboard' }
  | { screen: 'orders' }
  | { screen: 'createOrder' }
  | { screen: 'analysis'; orderId: string }
  | { screen: 'orderDetail'; orderId: string }
  | { screen: 'live'; orderId: string }
  | { screen: 'liveHub' }
  | { screen: 'mediaLibrary' }
  | { screen: 'mediaDetail'; mediaId: string }
  | { screen: 'media'; orderId: string }
  | { screen: 'notifications' }
  | { screen: 'notFound' }

export type CustomerScreen = CustomerRoute['screen']

export function parseCustomerRoute(hash: string): CustomerRoute {
  if (hash !== CUSTOMER_ROOT && !hash.startsWith(`${CUSTOMER_ROOT}/`)) {
    return { screen: 'notFound' }
  }

  const rest = hash.slice(CUSTOMER_ROOT.length)
  const segments = rest.split('/').filter(Boolean).map(decodeURIComponent)

  if (segments.length === 0) return { screen: 'dashboard' }

  const [head, ...tail] = segments

  switch (head) {
    case 'orders': {
      if (tail.length === 0) return { screen: 'orders' }
      if (tail[0] === 'new') return { screen: 'createOrder' }
      if (tail.length === 1) return { screen: 'orderDetail', orderId: tail[0] }
      if (tail.length === 2 && tail[1] === 'analysis')
        return { screen: 'analysis', orderId: tail[0] }
      if (tail.length === 2 && tail[1] === 'live')
        return { screen: 'live', orderId: tail[0] }
      if (tail.length === 2 && tail[1] === 'media')
        return { screen: 'media', orderId: tail[0] }
      return { screen: 'notFound' }
    }
    case 'live':
      return { screen: 'liveHub' }
    case 'media': {
      if (tail.length === 0) return { screen: 'mediaLibrary' }
      if (tail.length === 1) return { screen: 'mediaDetail', mediaId: tail[0] }
      return { screen: 'notFound' }
    }
    case 'notifications':
      return { screen: 'notifications' }
    default:
      return { screen: 'notFound' }
  }
}

export function customerHref(route: CustomerRoute): string {
  switch (route.screen) {
    case 'dashboard':
      return CUSTOMER_ROOT
    case 'orders':
      return `${CUSTOMER_ROOT}/orders`
    case 'createOrder':
      return `${CUSTOMER_ROOT}/orders/new`
    case 'analysis':
      return `${CUSTOMER_ROOT}/orders/${route.orderId}/analysis`
    case 'orderDetail':
      return `${CUSTOMER_ROOT}/orders/${route.orderId}`
    case 'live':
      return `${CUSTOMER_ROOT}/orders/${route.orderId}/live`
    case 'liveHub':
      return `${CUSTOMER_ROOT}/live`
    case 'mediaLibrary':
      return `${CUSTOMER_ROOT}/media`
    case 'mediaDetail':
      return `${CUSTOMER_ROOT}/media/${route.mediaId}`
    case 'media':
      return `${CUSTOMER_ROOT}/orders/${route.orderId}/media`
    case 'notifications':
      return `${CUSTOMER_ROOT}/notifications`
    case 'notFound':
      return CUSTOMER_ROOT
  }
}
