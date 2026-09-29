import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { customerMediaApi } from '../api/customerMediaApi'

/**
 * Sidebar badge: number of "media is ready" notifications
 * (`GET /api/customer/media-notifications`). `undefined` while loading or on
 * failure, so no badge is shown rather than a wrong one.
 */
export function useNewMediaCount(): number | undefined {
  const { data } = useApiQuery(
    (signal) => customerMediaApi.listNotifications(signal),
    [],
  )
  return data?.length
}
