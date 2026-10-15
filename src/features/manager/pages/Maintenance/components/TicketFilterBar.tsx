import type { Dispatch, SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import {
  getTicketSeverityLabel,
  getTicketStatusLabel,
} from '../../../../../shared/lib/statusTone'
import { COLUMNS, SEVERITIES, type StatusFilter } from '../maintenanceHelpers'
import { ticketFilterBarMessages } from './TicketFilterBar.messages'

/** Toolbar: search + status segmented control + priority/assignment selects. */
export function TicketFilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  assignedFilter,
  setAssignedFilter,
}: {
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  statusFilter: StatusFilter
  setStatusFilter: Dispatch<SetStateAction<StatusFilter>>
  priorityFilter: string
  setPriorityFilter: Dispatch<SetStateAction<string>>
  assignedFilter: string
  setAssignedFilter: Dispatch<SetStateAction<string>>
}) {
  const { t, lang } = useI18n(ticketFilterBarMessages)
  const options: StatusFilter[] = ['ALL', ...COLUMNS]
  return (
    <div className="mng-toolbar">
      <input
        className="odm-inp mng-search"
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t.searchPlaceholder}
        aria-label={t.searchAria}
      />
      <div className="mng-seg" role="group" aria-label={t.statusGroup}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`mng-seg-btn${statusFilter === option ? ' is-active' : ''}`}
            aria-pressed={statusFilter === option}
            onClick={() => setStatusFilter(option)}
          >
            {option === 'ALL' ? t.all : getTicketStatusLabel(option, lang)}
          </button>
        ))}
      </div>
      <select
        className="odm-inp mng-select"
        value={priorityFilter}
        onChange={(e) => setPriorityFilter(e.target.value)}
        aria-label={t.priorityAria}
      >
        <option value="ALL">{t.priorityAll}</option>
        {[...SEVERITIES].reverse().map((s) => (
          <option key={s} value={s}>
            {getTicketSeverityLabel(s, lang)}
          </option>
        ))}
      </select>
      <select
        className="odm-inp mng-select"
        value={assignedFilter}
        onChange={(e) => setAssignedFilter(e.target.value)}
        aria-label={t.assignedAria}
      >
        <option value="ALL">{t.assignedAll}</option>
        <option value="UNASSIGNED">{t.assignedUnassigned}</option>
        <option value="ASSIGNED">{t.assignedAssigned}</option>
      </select>
    </div>
  )
}
