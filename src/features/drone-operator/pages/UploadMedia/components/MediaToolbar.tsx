import { useI18n } from '../../../../../shared/i18n'
import { mediaToolbarMessages } from './MediaToolbar.messages'

export type MediaFilter = 'all' | 'pending' | 'uploaded'
export type MediaSort = 'newest' | 'oldest'
export type MediaView = 'grid' | 'list'

/** Media list header with filter, sort and view-mode controls. */
export function MediaToolbar({
  count,
  filter,
  sort,
  view,
  onFilterChange,
  onSortChange,
  onViewChange,
}: {
  count: number
  filter: MediaFilter
  sort: MediaSort
  view: MediaView
  onFilterChange: (filter: MediaFilter) => void
  onSortChange: (sort: MediaSort) => void
  onViewChange: (view: MediaView) => void
}) {
  const { t } = useI18n(mediaToolbarMessages)
  return (
    <header className="upload-media-toolbar">
      <h2>{t.mediaList}</h2>
      <span className="upload-media-count">{t.fileCount(count)}</span>
      <div className="upload-media-tools">
        <select
          aria-label={t.filterLabel}
          value={filter}
          onChange={(event) =>
            onFilterChange(event.target.value as MediaFilter)
          }
        >
          <option value="all">{t.filterAll}</option>
          <option value="pending">{t.filterPending}</option>
          <option value="uploaded">{t.filterUploaded}</option>
        </select>
        <select
          aria-label={t.sortLabel}
          value={sort}
          onChange={(event) => onSortChange(event.target.value as MediaSort)}
        >
          <option value="newest">{t.sortNewest}</option>
          <option value="oldest">{t.sortOldest}</option>
        </select>
        <span className="upload-media-seg" role="group">
          <button
            type="button"
            aria-pressed={view === 'grid'}
            aria-label={t.gridView}
            title={t.gridView}
            onClick={() => onViewChange('grid')}
          >
            ▦
          </button>
          <button
            type="button"
            aria-pressed={view === 'list'}
            aria-label={t.listView}
            title={t.listView}
            onClick={() => onViewChange('list')}
          >
            ☰
          </button>
        </span>
      </div>
    </header>
  )
}
