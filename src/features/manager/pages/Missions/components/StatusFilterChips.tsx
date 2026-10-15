import type { StatusChip } from '../missionsHelpers'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { statusFilterChipsMessages } from './StatusFilterChips.messages'

export function StatusFilterChips({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: StatusChip
  setStatusFilter: Dispatch<SetStateAction<StatusChip>>
}) {
  const { t } = useI18n(statusFilterChipsMessages)
  const statusChips: Array<{ value: StatusChip; label: string }> = [
    { value: 'ALL', label: t.statusChips.ALL },
    { value: 'IN_FLIGHT', label: t.statusChips.IN_FLIGHT },
    { value: 'COMPLETED', label: t.statusChips.COMPLETED },
    { value: 'FAILED', label: t.statusChips.FAILED },
    { value: 'CREATED', label: t.statusChips.CREATED },
  ]
  return (
    <div className="odm-or-filters" role="group" aria-label={t.title}>
      {statusChips.map((chip) => (
        <button
          key={chip.value}
          type="button"
          className={`odm-or-filter${statusFilter === chip.value ? ' is-active' : ''}`}
          aria-pressed={statusFilter === chip.value}
          onClick={() => setStatusFilter(chip.value)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
