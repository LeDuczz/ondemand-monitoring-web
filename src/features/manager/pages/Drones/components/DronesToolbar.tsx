import { useI18n } from '../../../../../shared/i18n'
import { getDroneStatusLabel } from '../../../../../shared/lib/statusTone'
import { FILTER_CHIP_VALUES, type FilterChip } from '../droneHelpers'
import { dronesPageMessages } from '../DronesPage.messages'

export function DronesToolbar({
  search,
  onSearch,
  filter,
  onFilter,
  counts,
}: {
  search: string
  onSearch: (value: string) => void
  filter: FilterChip
  onFilter: (value: FilterChip) => void
  counts: Record<string, number>
}) {
  const { t, lang } = useI18n(dronesPageMessages)
  return (
    <div className="odm-or-toolbar">
      <input
        type="search"
        className="odm-inp odm-or-toolbar-search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={t.searchPlaceholder}
        aria-label={t.searchAria}
      />
      <div className="odm-or-filters" role="group" aria-label={t.filterAria}>
        {FILTER_CHIP_VALUES.map((chip) => (
          <button
            key={chip}
            type="button"
            className={`odm-or-filter${filter === chip ? ' is-active' : ''}`}
            aria-pressed={filter === chip}
            onClick={() => onFilter(chip)}
          >
            {chip === 'ALL' ? t.filterAll : getDroneStatusLabel(chip, lang)} (
            {counts[chip] ?? 0})
          </button>
        ))}
      </div>
    </div>
  )
}
