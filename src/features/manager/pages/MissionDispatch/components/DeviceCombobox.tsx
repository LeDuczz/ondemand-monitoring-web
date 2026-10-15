import type { AvailableDrone } from '../../../../staff/api/droneApi'
import { useState, useRef, useMemo, useEffect, type KeyboardEvent } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { deviceComboboxMessages } from './DeviceCombobox.messages'
import { DeviceSelectedTrigger } from './DeviceSelectedTrigger'
import { DeviceEmptyTrigger } from './DeviceEmptyTrigger'
import { DevicePickerPanel } from './DevicePickerPanel'

export function DeviceCombobox({
  devices,
  selectedIds,
  open,
  onOpen,
  onClose,
  onToggle,
  onRemove,
  onClear,
}: {
  devices: AvailableDrone[]
  selectedIds: string[]
  open: boolean
  onOpen: () => void
  onClose: () => void
  onToggle: (deviceId: string) => void
  onRemove: (deviceId: string) => void
  onClear: () => void
}) {
  const { t } = useI18n(deviceComboboxMessages)

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const selectedDevices = selectedIds
    .map((deviceId) => devices.find((item) => item.id === deviceId))
    .filter(Boolean) as AvailableDrone[]
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return devices.filter((item) => {
      if (!keyword) return true
      return item.label.toLowerCase().includes(keyword)
    })
  }, [devices, query])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open, onClose])

  function openPicker() {
    onOpen()
    setQuery('')
    setActiveIndex(0)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  function closePicker() {
    onClose()
    triggerRef.current?.focus()
  }

  function choose(item: AvailableDrone) {
    onToggle(item.id)
    onClose()
    triggerRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closePicker()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) =>
        Math.min(index + 1, Math.max(0, filtered.length - 1)),
      )
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(0, index - 1))
      return
    }
    if (event.key === 'Enter' && filtered[activeIndex]) {
      event.preventDefault()
      choose(filtered[activeIndex])
    }
  }

  return (
    <div ref={rootRef} className="odm-dp-combo">
      {selectedDevices.length > 0 ? (
        <>
          <DeviceSelectedTrigger
            triggerRef={triggerRef}
            openPicker={openPicker}
            selectedDevices={selectedDevices}
            onRemove={onRemove}
          />
          <div className="odm-dp-combo-actions">
            <button
              ref={triggerRef}
              type="button"
              className="odm-btn odm-btn-gh odm-btn-sm"
              onClick={openPicker}
            >
              {t.changeDevice}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-sm"
              onClick={onClear}
            >
              {t.clearDevice}
            </button>
          </div>
        </>
      ) : (
        <DeviceEmptyTrigger triggerRef={triggerRef} openPicker={openPicker} />
      )}

      <DevicePickerPanel
        open={open}
        inputRef={inputRef}
        query={query}
        setQuery={setQuery}
        setActiveIndex={setActiveIndex}
        handleKeyDown={handleKeyDown}
        filtered={filtered}
        selectedIds={selectedIds}
        activeIndex={activeIndex}
        choose={choose}
      />
    </div>
  )
}
