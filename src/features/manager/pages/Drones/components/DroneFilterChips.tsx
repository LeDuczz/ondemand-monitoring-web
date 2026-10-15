import { FILTER_CHIP_VALUES, type FilterChip } from '../droneHelpers'
import type { Dispatch, SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { droneFilterChipsMessages } from './DroneFilterChips.messages'

/** Toolbar: search + segmented status filter (same options as before). */
export function DroneFilterChips({
  filter,
  setFilter,
  search,
  setSearch,
}: {
  filter: FilterChip
  setFilter: Dispatch<SetStateAction<FilterChip>>
  search: string
  setSearch: (value: string) => void
}) {
  const { t } = useI18n(droneFilterChipsMessages)
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
        {FILTER_CHIP_VALUES.map((chip) => (
          <button
            key={chip}
            type="button"
            className={`mng-seg-btn${filter === chip ? ' is-active' : ''}`}
            aria-pressed={filter === chip}
            onClick={() => setFilter(chip)}
          >
            {t.filters[chip]}
          </button>
        ))}
      </div>
    </div>
  )
}
