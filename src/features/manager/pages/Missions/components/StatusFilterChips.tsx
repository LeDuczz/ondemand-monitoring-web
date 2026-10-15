import type { StatusChip } from '../missionsHelpers'
import type { Dispatch, SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { statusFilterChipsMessages } from './StatusFilterChips.messages'

const STATUS_CHIPS: StatusChip[] = [
  'ALL',
  'IN_FLIGHT',
  'COMPLETED',
  'FAILED',
  'CREATED',
]

/** Toolbar: code search + segmented status filter (same options as before). */
export function StatusFilterChips({
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
}: {
  statusFilter: StatusChip
  setStatusFilter: Dispatch<SetStateAction<StatusChip>>
  search: string
  setSearch: (value: string) => void
}) {
  const { t } = useI18n(statusFilterChipsMessages)
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
        {STATUS_CHIPS.map((value) => (
          <button
            key={value}
            type="button"
            className={`mng-seg-btn${statusFilter === value ? ' is-active' : ''}`}
            aria-pressed={statusFilter === value}
            onClick={() => setStatusFilter(value)}
          >
            {t.statusChips[value as keyof typeof t.statusChips]}
          </button>
        ))}
      </div>
    </div>
  )
}
