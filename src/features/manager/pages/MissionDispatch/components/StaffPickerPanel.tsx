import { ManagerIcon } from '../../../components/common/ManagerIcon'
import type { KeyboardEvent } from 'react'
import type { AvailableOperator } from '../../../../staff/api/operatorApi'
import type { MissionStaffRole } from '../../../../mission/types/mission'
import type { RefObject } from 'react'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { staffPickerPanelMessages } from './StaffPickerPanel.messages'
import { StaffOptionRow } from './StaffOptionRow'

export function StaffPickerPanel({
  open,
  inputRef,
  query,
  setQuery,
  setActiveIndex,
  handleKeyDown,
  filtered,
  selectedRoleByStaff,
  selectedIds,
  activeIndex,
  choose,
}: {
  open: boolean
  inputRef: RefObject<HTMLInputElement | null>
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  setActiveIndex: Dispatch<SetStateAction<number>>
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  filtered: AvailableOperator[]
  selectedRoleByStaff: Map<string, MissionStaffRole[]>
  selectedIds: string[]
  activeIndex: number
  choose: (item: AvailableOperator) => void
}) {
  const { t } = useI18n(staffPickerPanelMessages)
  return (
    <>
      {open && (
        <div className="odm-dp-panel">
          <div className="odm-dp-panel-head">
            <div className="odm-dp-search">
              <ManagerIcon name="maintenance" size={15} />
              <input
                ref={inputRef}
                value={query}
                placeholder={t.staffSearchPlaceholder}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
            <span className="odm-dp-filter">{t.availableFilter}</span>
          </div>
          <div className="odm-dp-list">
            {filtered.length === 0 ? (
              <div className="odm-dp-list-empty">{t.noStaffFound}</div>
            ) : (
              filtered.map((item, index) => {
                const usedRoles = selectedRoleByStaff.get(item.id) ?? []
                const isSelected = selectedIds.includes(item.id)
                const isActive = activeIndex === index
                return (
                  <StaffOptionRow
                    key={item.id}
                    item={item}
                    setActiveIndex={setActiveIndex}
                    index={index}
                    choose={choose}
                    isSelected={isSelected}
                    isActive={isActive}
                    usedRoles={usedRoles}
                  />
                )
              })
            )}
          </div>
        </div>
      )}
    </>
  )
}
