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
        <div
          style={{
            position: 'absolute',
            zIndex: 80,
            top: 'calc(100% + 8px)',
            left: 0,
            width: 'min(460px, calc(100vw - 48px))',
            maxHeight: 300,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            background: '#fff',
            boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
          }}
        >
          <div style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 38,
                padding: '0 10px',
                border: '1px solid #e2e8f0',
                borderRadius: 9,
                background: '#f8fafc',
              }}
            >
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
                style={{
                  width: '100%',
                  border: 0,
                  outline: 0,
                  background: 'transparent',
                  fontSize: 14,
                  color: '#0f172a',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span
                style={{
                  borderRadius: 999,
                  padding: '4px 9px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {t.availableFilter}
              </span>
            </div>
          </div>
          <div
            role="listbox"
            aria-label={t.chooseDroneAria}
            style={{ maxHeight: 210, overflowY: 'auto', padding: 6 }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: 16, color: '#64748b', fontSize: 14 }}>
                {t.noAvailableDrones}
              </div>
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
