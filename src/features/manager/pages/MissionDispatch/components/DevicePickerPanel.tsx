import { ManagerIcon } from '../../../components/common/ManagerIcon'
import type { KeyboardEvent } from 'react'
import type { AvailableDrone } from '../../../../staff/api/droneApi'
import type { RefObject } from 'react'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { devicePickerPanelMessages } from './DevicePickerPanel.messages'
import { DeviceOptionRow } from './DeviceOptionRow'

export function DevicePickerPanel({
  open,
  inputRef,
  query,
  setQuery,
  setActiveIndex,
  handleKeyDown,
  filtered,
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
  filtered: AvailableDrone[]
  selectedIds: string[]
  activeIndex: number
  choose: (item: AvailableDrone) => void
}) {
  const { t } = useI18n(devicePickerPanelMessages)
  return (
    <>
      {open && (
        <div className="odm-dp-panel">
          <div className="odm-dp-panel-head">
            <div className="odm-dp-search">
              <ManagerIcon name="drones" size={15} />
              <input
                ref={inputRef}
                value={query}
                placeholder={t.deviceSearchPlaceholder}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
            <span className="odm-dp-filter">{t.availableFilter}</span>
          </div>
          <div
            className="odm-dp-list"
            role="listbox"
            aria-label={t.chooseDroneAria}
          >
            {filtered.length === 0 ? (
              <div className="odm-dp-list-empty">{t.noAvailableDrones}</div>
            ) : (
              filtered.map((item, index) => {
                const isSelected = selectedIds.includes(item.id)
                const isActive = activeIndex === index
                const [serial, modelPart] = item.label.split(' (')
                const model = modelPart
                  ? modelPart.replace(/\)$/, '')
                  : t.unknownModel
                return (
                  <DeviceOptionRow
                    key={item.id}
                    item={item}
                    isSelected={isSelected}
                    setActiveIndex={setActiveIndex}
                    index={index}
                    choose={choose}
                    isActive={isActive}
                    serial={serial}
                    model={model}
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
