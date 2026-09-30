import type { MediaNotification } from './types'

/** The only event the BE emits today (`AVAILABLE_EVENT` in the media service). */
export const MEDIA_AVAILABLE_EVENT = 'CUSTOMER_MEDIA_AVAILABLE'

/** Newest first; entries without a time go last. */
export function sortNotifications(items: MediaNotification[]): MediaNotification[] {
  const time = (n: MediaNotification) => (n.createdAt ? new Date(n.createdAt).getTime() || 0 : 0)
  return [...items].sort((a, b) => time(b) - time(a))
}
