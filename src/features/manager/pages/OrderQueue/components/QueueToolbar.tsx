import type { Dispatch, SetStateAction } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { QUEUE_FILTERS, type QueueFilter } from '../queueHelpers'
import { queueToolbarMessages } from './QueueToolbar.messages'

/** Toolbar: search + segmented filter. */
export function QueueToolbar({
  filter,
  setFilter,
  search,
  setSearch,
}: {
  filter: QueueFilter
  setFilter: Dispatch<SetStateAction<QueueFilter>>
  search: string
  setSearch: (value: string) => void
}) {
  const { t } = useI18n(queueToolbarMessages)
  return (
    <div className="mng-toolbar">
      <input
        className="odm-inp mng-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t.searchPlaceholder}
        aria-label={t.searchAria}
      />
      <div className="mng-seg" role="group" aria-label={t.title}>
        {QUEUE_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            className={`mng-seg-btn${filter === value ? ' is-active' : ''}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {t.filters[value]}
          </button>
        ))}
      </div>
    </div>
  )
}
