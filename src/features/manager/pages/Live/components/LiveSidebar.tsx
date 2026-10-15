import { ActiveMissionItem } from './ActiveMissionItem'
import type { MissionCalendarItem } from '../../../types/missions'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { liveSidebarMessages } from './LiveSidebar.messages'

export function LiveSidebar({
  activeMissions,
  listQuery,
  selected,
  setSelectedId,
}: {
  activeMissions: MissionCalendarItem[]
  listQuery: UseApiQueryState<{ items: MissionCalendarItem[] }>
  selected: MissionCalendarItem | null
  setSelectedId: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(liveSidebarMessages)
  return (
    <aside className="odm-live-sidebar">
      <div className="odm-live-sidebar-head">
        {t.sidebar.activeMissions}
        {activeMissions.length > 0 && (
          <span className="odm-live-count">{activeMissions.length}</span>
        )}
      </div>

      <div className="odm-live-list">
        {listQuery.loading && (
          <div aria-busy="true">
            {[1, 2, 3].map((i) => (
              <span key={i} className="odm-sk odm-live-sk" />
            ))}
          </div>
        )}

        {!listQuery.loading && !!listQuery.error && (
          <div className="odm-live-note is-error" role="alert">
            {t.sidebar.loadError}
            <button
              type="button"
              className="odm-btn"
              onClick={listQuery.reload}
            >
              {t.sidebar.retry}
            </button>
          </div>
        )}

        {!listQuery.loading &&
          !listQuery.error &&
          activeMissions.length === 0 && (
            <p className="odm-live-note">{t.sidebar.noActiveMissions}</p>
          )}

        {activeMissions.map((m) => (
          <ActiveMissionItem
            key={m.id}
            mission={m}
            selected={selected?.id === m.id}
            onSelect={() => setSelectedId(m.id)}
          />
        ))}
      </div>
    </aside>
  )
}
