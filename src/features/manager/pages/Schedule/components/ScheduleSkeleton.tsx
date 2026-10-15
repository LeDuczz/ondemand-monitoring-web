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
        <div
          style={{ padding: 40, textAlign: 'center', color: 'var(--tx3)' }}
          aria-busy="true"
        >
          <div
            className="odm-sk"
            style={{ height: 400, borderRadius: 8, margin: '0 16px' }}
          />
        </div>
      )}
    </>
  )
}
