import { useState, type Dispatch, type SetStateAction } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import type { LocalMedia } from '../../../../media/api/operatorMediaApi'
import type { MissionChecklistExecution } from '../../../../mission/types/checklistExecution'
import { finishedUploadStatuses } from '../uploadMediaHelpers'
import { MediaAttachChecklist } from './MediaAttachChecklist'
import { MediaCard } from './MediaCard'
import { mediaPanelMessages } from './MediaPanel.messages'
import {
  MediaToolbar,
  type MediaFilter,
  type MediaSort,
  type MediaView,
} from './MediaToolbar'

/** Filterable, sortable grid/list of local media cards. */
export function MediaPanel({
  items,
  approvable,
  loading,
  canManageMedia,
  isBusy,
  busyId,
  effectiveStatus,
  executions,
  selectedTargets,
  setSelectedTargets,
  attachFailures,
  setBusyId,
  onApprove,
  onDiscard,
  onUploadPc,
  onAttachSelected,
  onPreview,
}: {
  items: LocalMedia[]
  approvable: LocalMedia[]
  loading: boolean
  canManageMedia: boolean
  isBusy: boolean
  busyId: string | null
  effectiveStatus: (item: LocalMedia) => string
  /** Checklist items media can be attached to; undefined when attaching is not allowed. */
  executions: MissionChecklistExecution[] | undefined
  selectedTargets: Record<string, string[]>
  setSelectedTargets: Dispatch<SetStateAction<Record<string, string[]>>>
  attachFailures: Record<string, string>
  setBusyId: (id: string | null) => void
  onApprove: (item: LocalMedia, manual?: boolean) => void
  onDiscard: (item: LocalMedia) => void
  onUploadPc: (item: LocalMedia, file: File) => void
  onAttachSelected: (item: LocalMedia, mediaId: string) => Promise<void>
  onPreview: (item: LocalMedia) => void
}) {
  const { t } = useI18n(mediaPanelMessages)
  const [view, setView] = useState<MediaView>('grid')
  const [sort, setSort] = useState<MediaSort>('newest')
  const [filter, setFilter] = useState<MediaFilter>('all')
  const visibleItems = items
    .filter((item) => {
      if (filter === 'all') return true
      const done = finishedUploadStatuses.has(effectiveStatus(item))
      return filter === 'uploaded' ? done : !done
    })
    .sort((a, b) => {
      const diff =
        (Date.parse(a.capturedAt) || 0) - (Date.parse(b.capturedAt) || 0)
      return sort === 'newest' ? -diff : diff
    })

  return (
    <section className="upload-media-panel" aria-label={t.mediaList}>
      <MediaToolbar
        count={items.length}
        filter={filter}
        sort={sort}
        view={view}
        onFilterChange={setFilter}
        onSortChange={setSort}
        onViewChange={setView}
      />
      {!loading && visibleItems.length === 0 && (
        <p className="upload-media-empty">{t.emptyMedia}</p>
      )}
      <div className={`upload-media-grid${view === 'list' ? ' is-list' : ''}`}>
        {visibleItems.map((item) => {
          const selectedIds = selectedTargets[item.localMediaId] ?? []
          return (
            <MediaCard
              key={item.localMediaId}
              item={item}
              status={effectiveStatus(item)}
              canApprove={approvable.includes(item)}
              canManageMedia={canManageMedia}
              isBusy={isBusy}
              processing={busyId === item.localMediaId}
              attachFailure={attachFailures[item.localMediaId]}
              attachSection={
                executions && (
                  <MediaAttachChecklist
                    executions={executions}
                    selectedIds={selectedIds}
                    isBusy={isBusy}
                    canAttach={!!item.backendMediaId}
                    onToggle={(executionId, checked) =>
                      setSelectedTargets((previous) => {
                        const current = previous[item.localMediaId] ?? []
                        return {
                          ...previous,
                          [item.localMediaId]: checked
                            ? [...current, executionId]
                            : current.filter((id) => id !== executionId),
                        }
                      })
                    }
                    onAttach={() => {
                      const mediaId = item.backendMediaId
                      if (!mediaId) return
                      setBusyId(item.localMediaId)
                      void onAttachSelected(item, mediaId).finally(() =>
                        setBusyId(null),
                      )
                    }}
                  />
                )
              }
              onApprove={(manual) => onApprove(item, manual)}
              onPreview={() => onPreview(item)}
              onDiscard={() => onDiscard(item)}
              onUploadPc={(file) => onUploadPc(item, file)}
            />
          )
        })}
      </div>
    </section>
  )
}
