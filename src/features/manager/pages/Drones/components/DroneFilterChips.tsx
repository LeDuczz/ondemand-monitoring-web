import { FILTER_CHIP_VALUES, type FilterChip } from '../droneHelpers'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { droneFilterChipsMessages } from './DroneFilterChips.messages'

export function DroneFilterChips({
  filter,
  setFilter,
}: {
  filter: FilterChip
  setFilter: Dispatch<SetStateAction<FilterChip>>
}) {
  const { t } = useI18n(droneFilterChipsMessages)
  return (
    <div
      style={{ display: 'flex', gap: 6, padding: '8px 0', flexWrap: 'wrap' }}
    >
      {FILTER_CHIP_VALUES.map((chip) => (
        <button
          key={chip}
          type="button"
          className={`odm-chip${filter === chip ? ' odm-chip-active' : ''}`}
          onClick={() => setFilter(chip)}
        >
          {t.filters[chip]}
        </button>
      ))}
    </div>
  )
}
