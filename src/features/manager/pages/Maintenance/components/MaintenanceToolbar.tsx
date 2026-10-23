import { useI18n } from '../../../../../shared/i18n'
import {
  getTicketSeverityLabel,
  getTicketStatusLabel,
} from '../../../../../shared/lib/statusTone'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import {
  SEVERITIES,
  STATUS_FILTERS,
  type PriorityFilter,
  type StatusFilter,
} from '../maintenanceHelpers'

export function MaintenanceToolbar({
  search,
  onSearch,
  status,
  onStatus,
  priority,
  onPriority,
}: {
  search: string
  onSearch: (value: string) => void
  status: StatusFilter
  onStatus: (value: StatusFilter) => void
  priority: PriorityFilter
  onPriority: (value: PriorityFilter) => void
}) {
  const { t, lang } = useI18n(maintenancePageMessages)
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
      <div className="odm-or-seg odm-or-seg-auto" role="group" aria-label={t.statusAria}>
        {STATUS_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            className={`odm-or-seg-btn${status === value ? ' is-active' : ''}`}
            aria-pressed={status === value}
            onClick={() => onStatus(value)}
          >
            {value === 'ALL' ? t.statusAll : getTicketStatusLabel(value, lang)}
          </button>
        ))}
      </div>
      <select
        className="odm-inp odm-or-toolbar-select"
        aria-label={t.priorityAria}
        value={priority}
        onChange={(e) => onPriority(e.target.value as PriorityFilter)}
      >
        <option value="ALL">{t.priorityAll}</option>
        {SEVERITIES.map((s) => (
          <option key={s} value={s}>
            {getTicketSeverityLabel(s, lang)}
          </option>
        ))}
      </select>
    </div>
  )
}
