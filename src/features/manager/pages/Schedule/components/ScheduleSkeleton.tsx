import type { MissionCalendarItem } from '../../../types/missions'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'

export function ScheduleSkeleton({
  query,
}: {
  query: UseApiQueryState<{ items: MissionCalendarItem[] }>
}) {
  return (
    <>
      {query.loading && (
        <div aria-busy="true">
          <span className="odm-sk mng-dash-sk" style={{ height: 360 }} />
        </div>
      )}
    </>
  )
}
