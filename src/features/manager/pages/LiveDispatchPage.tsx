import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

import { env } from '../../../config/env'
import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { displayOrderCode } from '../../../shared/lib/orderCode'
import {
  SIMULATION_MAP_DEFAULT_CROP,
  simulationMapImageStyle,
  worldToViewportPercent,
} from '../../../shared/lib/simulationMapProjection'
import { missionApi } from '../../mission/api/missionApi'
import { droneApi, type AvailableDrone } from '../../staff/api/droneApi'
import { operatorApi, type AvailableOperator } from '../../staff/api/operatorApi'
import { ManagerIcon, type ManagerIconName } from '../components/ManagerIcon'
import { managerHref } from '../routes'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import type { MissionStaffRole } from '../../mission/types/mission'

const missionRoles: MissionStaffRole[] = [
  'PILOT',
  'OPERATOR',
  'MAINTAINER',
  'INSPECTOR',
]

const SIMULATION_MAP_TOP_IMAGE = '/simulation-viewer/simulation_map_top.png'
const SIMULATION_MAP_VERSION = '20260925113000'
const SIMULATION_MAP_BOUNDS = {
  minX: -417.15933531249993,
  maxX: 415.15933531249993,
  minY: -414.65578218749977,
  maxY: 417.66288843749993,
}
const SIMULATION_MAP_IMAGE_CROP = SIMULATION_MAP_DEFAULT_CROP

type DispatchStep = 'order' | 'mission' | 'staff' | 'device' | 'confirm'
const dispatchSteps: DispatchStep[] = ['order', 'mission', 'staff', 'device', 'confirm']

const stepSubtitles: Record<DispatchStep, keyof (typeof liveDispatchPageMessages)['vi']> = {
  order: 'orderStepHint',
  mission: 'missionStepHint',
  staff: 'staffStepHint',
  device: 'deviceStepHint',
  confirm: 'confirmStepHint',
}

function fmtDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function fmtDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function preferredTimeLabel(value?: string | null) {
  const key = value?.trim().toUpperCase()
  if (!key) return ''
  const labels: Record<string, string> = {
    MORNING: 'Buổi sáng',
    AFTERNOON: 'Buổi chiều',
    EVENING: 'Buổi tối',
    NIGHT: 'Buổi đêm',
  }
  return labels[key] ?? value?.trim() ?? ''
}

function missionStatusLabel(
  status: string,
  labels: (typeof liveDispatchPageMessages)['vi']['missionStatuses'],
) {
  return labels[status as keyof typeof labels] ?? status
}

function requestedWindow(current: { orderPreferredDateFrom?: string | null; orderPreferredDateTo?: string | null; orderPreferredTimeName?: string | null }) {
  const from = fmtDate(current.orderPreferredDateFrom)
  const to = fmtDate(current.orderPreferredDateTo)
  const dateText = from === to ? from : `${from} → ${to}`
  const timeLabel = preferredTimeLabel(current.orderPreferredTimeName)
  return timeLabel ? `${dateText} · ${timeLabel}` : dateText
}

function fmtRadius(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${Number.isInteger(value) ? value : value.toFixed(1)} m`
}

function OrderInfoItem({
  icon,
  tone,
  label,
  children,
}: {
  icon: ManagerIconName
  tone: string
  label: string
  children: ReactNode
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '42px minmax(0, 1fr)', gap: 13 }}>
      <span
        aria-hidden="true"
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          display: 'grid',
          placeItems: 'center',
          background: tone,
          color: '#1d4ed8',
        }}
      >
        <ManagerIcon name={icon} size={20} />
      </span>
      <div>
        <div className="odm-mgr-review-hint" style={{ fontSize: 12.5, fontWeight: 550 }}>
          {label}
        </div>
        <div style={{ fontSize: 15.5, fontWeight: 650, lineHeight: 1.35, color: '#111827' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function staffInitials(staff: AvailableOperator) {
  const source = staff.fullName || staff.email || '?'
  const parts = source.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

function StaffStatusBadge() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: '#15803d',
        fontSize: 12,
        fontWeight: 650,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: '#16a34a',
        }}
      />
      Sẵn sàng
    </span>
  )
}

function StaffAvatar({ staff }: { staff: AvailableOperator }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        display: 'inline-grid',
        placeItems: 'center',
        flex: '0 0 auto',
        background: '#dbeafe',
        color: '#1d4ed8',
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {staffInitials(staff)}
    </span>
  )
}

function StaffCombobox({
  role,
  staff,
  selectedIds,
  staffByRole,
  open,
  t,
  onOpen,
  onClose,
  onToggle,
  onRemove,
}: {
  role: MissionStaffRole
  staff: AvailableOperator[]
  selectedIds: string[]
  staffByRole: Partial<Record<MissionStaffRole, string[]>>
  open: boolean
  t: (typeof liveDispatchPageMessages)['vi']
  onOpen: () => void
  onClose: () => void
  onToggle: (staffId: string) => void
  onRemove: (staffId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const selectedStaff = selectedIds
    .map((staffId) => staff.find((item) => item.id === staffId))
    .filter(Boolean) as AvailableOperator[]
  const selectedRoleByStaff = useMemo(() => {
    const result = new Map<string, MissionStaffRole[]>()
    Object.entries(staffByRole).forEach(([staffRole, staffIds]) => {
      if (!staffIds?.length || staffRole === role) return
      staffIds.forEach((staffId) => {
        const roles = result.get(staffId) ?? []
        roles.push(staffRole as MissionStaffRole)
        result.set(staffId, roles)
      })
    })
    return result
  }, [role, staffByRole])
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return staff.filter((item) => {
      if (!keyword) return true
      const haystack = `${item.fullName} ${item.email}`.toLowerCase()
      return haystack.includes(keyword)
    })
  }, [query, staff])

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

  function choose(item: AvailableOperator) {
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
      setActiveIndex((index) => Math.min(index + 1, Math.max(0, filtered.length - 1)))
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
    <div ref={rootRef} style={{ position: 'relative', display: 'grid', gap: 8 }}>
      {selectedStaff.length > 0 ? (
        <>
          <button
            ref={triggerRef}
            type="button"
            onClick={openPicker}
            style={{
              display: 'grid',
              gridTemplateColumns: '36px minmax(0, 1fr) auto',
              gap: 10,
              alignItems: 'center',
              width: '100%',
              minHeight: 74,
              padding: 10,
              border: '1px solid #bfdbfe',
              borderRadius: 12,
              background: '#eff6ff',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'grid', gap: 8, gridColumn: '1 / -1' }}>
              {selectedStaff.map((selected) => (
                <span
                  key={selected.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px minmax(0, 1fr) auto',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <StaffAvatar staff={selected} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {selected.fullName}
                    </span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selected.email}
                    </span>
                    <span style={{ display: 'block', marginTop: 5 }}>
                      <StaffStatusBadge />
                    </span>
                  </span>
            <span
              role="button"
              tabIndex={0}
              aria-label={t.clearStaff}
              onClick={(event) => {
                event.stopPropagation()
                      onRemove(selected.id)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  event.stopPropagation()
                        onRemove(selected.id)
                }
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                display: 'inline-grid',
                placeItems: 'center',
                color: '#64748b',
                background: '#fff',
                border: '1px solid #dbeafe',
                fontSize: 18,
              }}
            >
              ×
            </span>
                </span>
              ))}
            </span>
          </button>
          <button
            ref={triggerRef}
            type="button"
            className="odm-btn odm-btn-gh odm-btn-sm"
            onClick={openPicker}
            style={{ justifySelf: 'start', minHeight: 30, borderRadius: 8 }}
          >
                    {t.changeStaff}
          </button>
        </>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={openPicker}
          aria-label={t.chooseOperatorAria(t.roles[role])}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            width: '100%',
            minHeight: 42,
            padding: '0 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            background: '#fff',
            color: '#64748b',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ManagerIcon name="maintenance" size={16} />
            {t.chooseStaff}
          </span>
          <span aria-hidden="true" style={{ color: '#94a3b8' }}>⌄</span>
        </button>
      )}

      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 80,
            top: 'calc(100% + 8px)',
            left: 0,
            width: 'min(420px, calc(100vw - 48px))',
            maxHeight: 280,
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
              <span style={{ borderRadius: 999, padding: '4px 9px', background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 700 }}>
                {t.availableFilter}
              </span>
            </div>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', padding: 6 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 16, color: '#64748b', fontSize: 14 }}>
                {t.noStaffFound}
              </div>
            ) : (
              filtered.map((item, index) => {
                const usedRoles = selectedRoleByStaff.get(item.id) ?? []
                const isSelected = selectedIds.includes(item.id)
                const isActive = activeIndex === index
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(item)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px minmax(0, 1fr) auto',
                      gap: 10,
                      alignItems: 'center',
                      width: '100%',
                      minHeight: 62,
                      padding: '8px 10px',
                      border: 0,
                      borderRadius: 10,
                      background: isSelected ? '#eff6ff' : isActive ? '#f8fafc' : '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <StaffAvatar staff={item} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.fullName}
                        </span>
                        {usedRoles.map((usedRole) => (
                          <span
                            key={usedRole}
                            style={{
                              borderRadius: 999,
                              padding: '2px 7px',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              fontSize: 11,
                              fontWeight: 700,
                              flex: '0 0 auto',
                            }}
                          >
                            {t.roles[usedRole]}
                          </span>
                        ))}
                      </span>
                      <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.email}
                      </span>
                      <span style={{ display: 'block', marginTop: 5 }}>
                        <StaffStatusBadge />
                      </span>
                    </span>
                    <span style={{ color: isSelected ? '#2563eb' : 'transparent', fontSize: 18, fontWeight: 900 }}>
                      ✓
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DeviceCombobox({
  devices,
  selectedIds,
  open,
  t,
  onOpen,
  onClose,
  onToggle,
  onRemove,
  onClear,
}: {
  devices: AvailableDrone[]
  selectedIds: string[]
  open: boolean
  t: (typeof liveDispatchPageMessages)['vi']
  onOpen: () => void
  onClose: () => void
  onToggle: (deviceId: string) => void
  onRemove: (deviceId: string) => void
  onClear: () => void
}) {
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
      setActiveIndex((index) => Math.min(index + 1, Math.max(0, filtered.length - 1)))
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
    <div ref={rootRef} style={{ position: 'relative', display: 'grid', gap: 10 }}>
      {selectedDevices.length > 0 ? (
        <>
          <button
            ref={triggerRef}
            type="button"
            onClick={openPicker}
            style={{
              display: 'grid',
              gap: 8,
              width: '100%',
              minHeight: 74,
              padding: 10,
              border: '1px solid #bfdbfe',
              borderRadius: 12,
              background: '#eff6ff',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            {selectedDevices.map((device) => {
              const [serial, modelPart] = device.label.split(' (')
              const model = modelPart ? modelPart.replace(/\)$/, '') : t.unknownModel
              return (
                <span
                  key={device.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px minmax(0, 1fr) auto',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      display: 'grid',
                      placeItems: 'center',
                      background: '#dbeafe',
                      color: '#2563eb',
                    }}
                  >
                    <ManagerIcon name="drones" size={18} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {serial || t.device}
                    </span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {model}
                    </span>
                    <span style={{ display: 'block', marginTop: 5 }}>
                      <StaffStatusBadge />
                    </span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`${t.clearDevice} ${device.label}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onRemove(device.id)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        event.stopPropagation()
                        onRemove(device.id)
                      }
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      display: 'inline-grid',
                      placeItems: 'center',
                      color: '#64748b',
                      background: '#fff',
                      border: '1px solid #dbeafe',
                      fontSize: 18,
                    }}
                  >
                    ×
                  </span>
                </span>
              )
            })}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              ref={triggerRef}
              type="button"
              className="odm-btn odm-btn-gh odm-btn-sm"
              onClick={openPicker}
              style={{ minHeight: 30, borderRadius: 8 }}
            >
              {t.changeDevice}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-sm"
              onClick={onClear}
              style={{ minHeight: 30, borderRadius: 8 }}
            >
              {t.clearDevice}
            </button>
          </div>
        </>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={openPicker}
          aria-label={t.chooseDroneAria}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            width: '100%',
            minHeight: 42,
            padding: '0 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            background: '#fff',
            color: '#64748b',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ManagerIcon name="drones" size={16} />
            {t.chooseDroneOption}
          </span>
          <span aria-hidden="true" style={{ color: '#94a3b8' }}>⌄</span>
        </button>
      )}

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
              <span style={{ borderRadius: 999, padding: '4px 9px', background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 700 }}>
                {t.availableFilter}
              </span>
            </div>
          </div>
          <div role="listbox" aria-label={t.chooseDroneAria} style={{ maxHeight: 210, overflowY: 'auto', padding: 6 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 16, color: '#64748b', fontSize: 14 }}>
                {t.noAvailableDrones}
              </div>
            ) : (
              filtered.map((item, index) => {
                const isSelected = selectedIds.includes(item.id)
                const isActive = activeIndex === index
                const [serial, modelPart] = item.label.split(' (')
                const model = modelPart ? modelPart.replace(/\)$/, '') : t.unknownModel
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-label={`${t.chooseDroneAria} ${item.label}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(item)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px minmax(0, 1fr) auto',
                      gap: 10,
                      alignItems: 'center',
                      width: '100%',
                      minHeight: 62,
                      padding: '8px 10px',
                      border: 0,
                      borderRadius: 10,
                      background: isSelected ? '#eff6ff' : isActive ? '#f8fafc' : '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        display: 'grid',
                        placeItems: 'center',
                        background: '#dbeafe',
                        color: '#2563eb',
                      }}
                    >
                      <ManagerIcon name="drones" size={18} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {serial || t.device}
                      </span>
                      <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {model}
                      </span>
                      <span style={{ display: 'block', marginTop: 5 }}>
                        <StaffStatusBadge />
                      </span>
                    </span>
                    <span style={{ color: isSelected ? '#2563eb' : 'transparent', fontSize: 18, fontWeight: 900 }}>
                      ✓
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Real resource assignment in the existing manager shell; no invented ranking data. */
export function LiveDispatchPage({ missionId }: { missionId: string }) {
  const { t } = useI18n(liveDispatchPageMessages)
  const mission = useApiQuery(
    () => missionApi.getMissionById(missionId),
    [missionId],
  )
  const drones = useApiQuery(() => droneApi.getAvailable(), [missionId])
  const operators = useApiQuery(() => operatorApi.getAvailable(), [missionId])
  const [droneIds, setDroneIds] = useState<string[]>([])
  const [staffByRole, setStaffByRole] = useState<
    Partial<Record<MissionStaffRole, string[]>>
  >({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<DispatchStep>('order')
  const [openStaffRole, setOpenStaffRole] = useState<MissionStaffRole | null>(null)
  const [devicePickerOpen, setDevicePickerOpen] = useState(false)

  const selectedStaffIds = missionRoles
    .flatMap((role) => staffByRole[role] ?? [])
  const hasAllRoles = missionRoles.every((role) => (staffByRole[role] ?? []).length > 0)

  async function assign() {
    if (droneIds.length === 0 || !hasAllRoles) {
      setError(t.selectDroneAndOperator)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await missionApi.assignResources(missionId, droneIds, staffByRole)
      mission.reload()
      drones.reload()
      operators.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.assignFailed)
    } finally {
      setBusy(false)
    }
  }

  if (mission.loading || drones.loading || operators.loading) {
    return <div className="odm-mgr-dash">{t.loadingResources}</div>
  }
  if (mission.error || drones.error || operators.error || !mission.data) {
    return (
      <StateView
        state="error"
        title={t.loadError}
        error={mission.error ?? drones.error ?? operators.error}
        onRetry={() => {
          mission.reload()
          drones.reload()
          operators.reload()
        }}
      />
    )
  }

  const current = mission.data
  const currentOrderCode = displayOrderCode(current.orderCode, current.orderId)
  const assignable =
    current.status === 'RESOURCE_ASSIGNING' || current.status === 'CREATED'
  const activeStepIndex = dispatchSteps.indexOf(activeStep)
  const selectedDrones = (drones.data ?? []).filter((drone) => droneIds.includes(drone.id))
  const hasTarget = current.latitude != null && current.longitude != null
  const target = hasTarget
    ? worldToViewportPercent(
        { simX: current.longitude ?? 0, simY: current.latitude ?? 0 },
        SIMULATION_MAP_BOUNDS,
        SIMULATION_MAP_IMAGE_CROP,
      )
    : null
  const mapImageUrl = `${env.apiBaseUrl}${SIMULATION_MAP_TOP_IMAGE}?v=${SIMULATION_MAP_VERSION}`
  const imageStyle = simulationMapImageStyle(SIMULATION_MAP_IMAGE_CROP)
  const stepLabels: Record<DispatchStep, string> = {
    order: t.orderTab,
    mission: t.missionTab,
    staff: t.staffTab,
    device: t.deviceTab,
    confirm: t.confirmTab,
  }
  const goNext = () => {
    setActiveStep(dispatchSteps[Math.min(activeStepIndex + 1, dispatchSteps.length - 1)])
  }
  const goPrevious = () => {
    setActiveStep(dispatchSteps[Math.max(activeStepIndex - 1, 0)])
  }
  return (
    <div className="odm-mgr-dash" style={{ padding: '28px 32px', background: '#f7f9fc' }}>
      <div className="odm-mgr-dash-head" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="odm-mgr-dash-title" style={{ fontSize: 24, fontWeight: 700 }}>
            {t.createMissionTitle}
          </h1>
          <div className="odm-mgr-dash-date" style={{ fontSize: 14 }}>
            {t.createMissionSubtitle}
          </div>
        </div>
        <a
          className="odm-btn"
          href={managerHref({ screen: 'orderQueue' })}
          style={{
            background: '#fff',
            borderColor: '#d8dee9',
            borderRadius: 9,
            minHeight: 38,
            padding: '0 14px',
          }}
        >
          {t.backToQueue}
        </a>
      </div>
      {!assignable ? (
        <div className="odm-card">
          <div className="odm-card-body">
            {t.alreadyAssigned(
              current.droneCode ?? '—',
              current.operatorId ?? '—',
            )}
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: 0,
              marginBottom: 18,
              minHeight: 72,
              padding: 6,
              border: '1px solid #e5e7eb',
              borderRadius: 14,
              background: '#fff',
              boxShadow: '0 8px 22px rgba(15, 23, 42, 0.04)',
            }}
          >
            {dispatchSteps.map((step, index) => (
              <button
                key={step}
                type="button"
                onClick={() => setActiveStep(step)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 60,
                  padding: '0 18px',
                  border: 0,
                  borderRadius: 12,
                  background: activeStep === step ? '#eff6ff' : 'transparent',
                  color: activeStep === step ? '#2563eb' : '#111827',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    display: 'inline-grid',
                    placeItems: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: activeStep === step ? '#2563eb' : '#f3f4f6',
                    color: activeStep === step ? '#fff' : '#111827',
                    fontWeight: 800,
                    boxShadow: activeStep === step ? '0 8px 18px rgba(37, 99, 235, 0.22)' : 'none',
                  }}
                >
                  {index + 1}
                </span>
                <span>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 750 }}>
                    {stepLabels[step]}
                  </span>
                  <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: activeStep === step ? '#2563eb' : '#64748b' }}>
                    {t[stepSubtitles[step]] as string}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {activeStep === 'order' && (
            <>
            <div
              className="odm-card"
              style={{
                marginBottom: 18,
                borderRadius: 16,
                border: '1px solid #e5e7eb',
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)',
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <div
                className="odm-card-header"
                style={{
                  minHeight: 52,
                  padding: '0 24px',
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <ManagerIcon name="order-queue" size={18} />
                  {t.orderInfoTitle}
                </span>
                {current.orderId && (
                  <a
                    className="odm-btn odm-btn-sm"
                    href={managerHref({
                      screen: 'orderReview',
                      orderId: current.orderId,
                    })}
                    style={{
                      background: '#eff6ff',
                      borderColor: '#dbeafe',
                      color: '#2563eb',
                      borderRadius: 9,
                      textDecoration: 'none',
                    }}
                  >
                    {t.viewOrderDetail}
                  </a>
                )}
              </div>
              <div
                className="odm-card-body"
                style={{
                  display: 'grid',
                  gridTemplateColumns: target
                    ? 'minmax(0, 65fr) minmax(360px, 35fr)'
                    : '1fr',
                  gap: 24,
                  alignItems: 'start',
                  padding: '20px 24px 24px',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))',
                    gap: '26px 28px',
                    padding: '4px 0',
                  }}
                >
                  <OrderInfoItem icon="dashboard" tone="#e8f0ff" label={t.orderId}>
                    <span className="odm-mono" style={{ wordBreak: 'break-word' }}>
                      {currentOrderCode}
                    </span>
                  </OrderInfoItem>
                  <OrderInfoItem icon="maintenance" tone="#dcfce7" label={t.customer}>
                    {current.customerName ?? '—'}
                  </OrderInfoItem>
                  <OrderInfoItem icon="mission" tone="#f3e8ff" label={t.service}>
                    {current.serviceName ?? '—'}
                  </OrderInfoItem>
                  <OrderInfoItem icon="live" tone="#ffe4ec" label={t.areaRadius}>
                    <strong>{fmtRadius(current.radiusM)}</strong>
                  </OrderInfoItem>
                  <OrderInfoItem icon="schedule" tone="#ffedd5" label={t.customerDeadline}>
                    <strong>{requestedWindow(current)}</strong>
                  </OrderInfoItem>
                  <OrderInfoItem icon="media" tone="#eef2ff" label={t.orderTitle}>
                    <span style={{ fontWeight: 600, color: 'var(--tx2)' }}>
                      {current.orderTitle ?? '—'}
                    </span>
                  </OrderInfoItem>
                </div>
                {target && (
                  <div
                    className="odm-mgr-review-map"
                    style={{
                      minHeight: 0,
                      height: 286,
                      borderRadius: 14,
                      border: '1px solid var(--bd)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.3)',
                    }}
                  >
                    <img
                      className="odm-mgr-review-map-image"
                      src={mapImageUrl}
                      alt=""
                      style={imageStyle}
                    />
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label={t.mapAriaLabel}
                    >
                      <circle
                        cx={target.x}
                        cy={target.y}
                        r="14"
                        className="odm-mgr-map-radius"
                        vectorEffect="non-scaling-stroke"
                      />
                      <g transform={`translate(${target.x},${target.y})`}>
                        <path
                          d="M0 0 C-2.6 -3.1 -3.5 -4.7 -3.5 -6 a3.5 3.5 0 017 0 C3.5 -4.7 2.6 -3.1 0 0z"
                          className="odm-mgr-map-pin"
                          vectorEffect="non-scaling-stroke"
                        />
                        <circle
                          cy="-6"
                          r="1.2"
                          className="odm-mgr-map-pin-dot"
                          vectorEffect="non-scaling-stroke"
                        />
                      </g>
                      <text
                        x={target.x}
                        y={Math.min(97, target.y + 9)}
                        textAnchor="middle"
                        className="odm-mgr-map-label"
                      >
                        X {current.longitude?.toFixed(1) ?? '—'} · Y {current.latitude?.toFixed(1) ?? '—'}
                      </text>
                    </svg>
                    <div
                      style={{
                        position: 'absolute',
                        left: 14,
                        right: 14,
                        bottom: 14,
                        borderRadius: 10,
                        padding: '11px 12px',
                        background: 'rgba(15, 23, 42, 0.82)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800 }}>{t.mapAriaLabel}</div>
                        <div style={{ fontSize: 12, opacity: 0.82, marginTop: 2 }}>
                          X {current.longitude?.toFixed(4) ?? '—'}, Y {current.latitude?.toFixed(4) ?? '—'}
                        </div>
                      </div>
                      <a
                        className="odm-btn odm-btn-sm"
                        href={managerHref({
                          screen: 'orderReview',
                          orderId: current.orderId ?? '',
                        })}
                        style={{ background: '#fff', color: '#0f172a' }}
                      >
                        {t.openMap}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </>
          )}

          {activeStep === 'mission' && (
            <div className="odm-card" style={{ marginBottom: 14 }}>
              <div className="odm-card-header">{t.missionImplementation}</div>
              <div className="odm-card-body odm-mgr-review-location-grid">
                <div>
                  <div className="odm-mgr-review-hint">{t.missionHeader(current.missionCode)}</div>
                  <div className="odm-mono" style={{ fontWeight: 700 }}>
                    {current.missionCode}
                  </div>
                </div>
                <div>
                  <div className="odm-mgr-review-hint">{t.status}</div>
                  {missionStatusLabel(current.status, t.missionStatuses)}
                </div>
                <div>
                  <div className="odm-mgr-review-hint">{t.actualSchedule}</div>
                  <strong>
                    {fmtDateTime(current.scheduledStartAt)}
                    {current.scheduledEndAt ? ` → ${fmtDateTime(current.scheduledEndAt)}` : ''}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'staff' && (
            <div className="odm-card" style={{ marginBottom: 14 }}>
              <div className="odm-card-header">{t.step1}</div>
              <div className="odm-card-body" style={{ display: 'grid', gap: 12 }}>
              <p style={{ margin: 0, color: 'var(--tx3)' }}>{t.roleHelp}</p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 12,
                }}
              >
                {missionRoles.map((role) => {
                  const selected = staffByRole[role] ?? []
                  return (
                  <section
                    key={role}
                    style={{
                      display: 'grid',
                      alignContent: 'start',
                      gap: 10,
                      minHeight: 190,
                      padding: 14,
                      border: '1px solid var(--bd)',
                      borderRadius: 12,
                      background: selected.length > 0 ? '#f8fbff' : '#fff',
                      boxShadow: '0 8px 20px rgba(15,23,42,0.04)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontWeight: 800 }}>{t.roleIcons[role]} {t.roles[role]}</span>
                      {selected.length > 0 && <span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span>}
                    </span>
                    <span style={{ color: 'var(--tx3)', fontSize: 12 }}>
                      {t.roleDescriptions[role]}
                    </span>
                    <StaffCombobox
                      role={role}
                      staff={operators.data ?? []}
                      selectedIds={selected}
                      staffByRole={staffByRole}
                      open={openStaffRole === role}
                      t={t}
                      onOpen={() => setOpenStaffRole(role)}
                      onClose={() => setOpenStaffRole(null)}
                      onToggle={(staffId) => {
                        setStaffByRole((cur) => {
                          const current = cur[role] ?? []
                          const nextRoleStaff = current.includes(staffId)
                            ? current.filter((id) => id !== staffId)
                            : [...current, staffId]
                          return {
                            ...cur,
                            [role]: nextRoleStaff,
                          }
                        })
                        setError(null)
                      }}
                      onRemove={(staffId) => {
                        setStaffByRole((cur) => ({
                          ...cur,
                          [role]: (cur[role] ?? []).filter((id) => id !== staffId),
                        }))
                        setError(null)
                      }}
                    />
                  </section>
                  )
                })}
              </div>
              {!operators.data?.length && <p>{t.noAvailableOperators}</p>}
              {selectedStaffIds.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--tx3)',
                  }}
                >
                  <strong style={{ color: 'var(--tx)' }}>{t.selectedStaff}</strong>
                  {missionRoles.flatMap((role) =>
                    (staffByRole[role] ?? []).map((selectedId) => {
                      const staff = (operators.data ?? []).find((item) => item.id === selectedId)
                      if (!staff) return null
                      return (
                        <span
                          key={`${role}-${selectedId}`}
                          className="odm-tn"
                          style={{
                            display: 'inline-flex',
                            gap: 6,
                            alignItems: 'center',
                            border: '1px solid var(--bd)',
                            borderRadius: 999,
                            padding: '4px 10px',
                            background: '#fff',
                          }}
                        >
                          <b>{t.roles[role]}</b>
                          {staff.fullName}
                          <button
                            type="button"
                            className="odm-btn odm-btn-gh odm-btn-sm"
                            style={{ padding: '0 6px', minHeight: 22 }}
                            onClick={() =>
                              setStaffByRole((cur) => ({
                                ...cur,
                                [role]: (cur[role] ?? []).filter((id) => id !== selectedId),
                              }))
                            }
                            aria-label={`${t.clearStaff} ${staff.fullName}`}
                          >
                            ×
                          </button>
                        </span>
                      )
                    }),
                  )}
                  <button
                    type="button"
                    className="odm-btn odm-btn-gh odm-btn-sm"
                    onClick={() => setStaffByRole({})}
                  >
                    {t.clearAll}
                  </button>
                </div>
              )}
              </div>
            </div>
          )}

          {activeStep === 'device' && (
            <div
              className="odm-card"
              style={{
                marginBottom: 14,
                borderRadius: 16,
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div className="odm-card-header">
                <span>{t.step2}</span>
                {selectedDrones.length > 0 && (
                  <span
                    style={{
                      borderRadius: 999,
                      background: '#eff6ff',
                      color: '#2563eb',
                      padding: '5px 10px',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {selectedDrones.length} {t.selectedDevice}
                  </span>
                )}
              </div>
              <div className="odm-card-body" style={{ display: 'grid', gap: 14 }}>
                <p style={{ margin: 0, color: '#64748b' }}>{t.deviceHelp}</p>
                {!drones.data?.length ? (
                  <p>{t.noAvailableDrones}</p>
                ) : (
                  <section
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 14,
                      padding: 16,
                      background: '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{t.selectedDevice}</div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>
                          {selectedDrones.length > 0 ? `${selectedDrones.length} ${t.device}` : t.chooseDroneOption}
                        </div>
                      </div>
                      {selectedDrones.length > 0 && <span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span>}
                    </div>
                    <DeviceCombobox
                      devices={drones.data ?? []}
                      selectedIds={droneIds}
                      open={devicePickerOpen}
                      t={t}
                      onOpen={() => {
                        setDevicePickerOpen(true)
                        setOpenStaffRole(null)
                      }}
                      onClose={() => setDevicePickerOpen(false)}
                      onToggle={(deviceId) => {
                        setDroneIds((currentIds) =>
                          currentIds.includes(deviceId)
                            ? currentIds.filter((id) => id !== deviceId)
                            : [...currentIds, deviceId],
                        )
                        setError(null)
                      }}
                      onRemove={(deviceId) => {
                        setDroneIds((currentIds) => currentIds.filter((id) => id !== deviceId))
                        setError(null)
                      }}
                      onClear={() => {
                        setDroneIds([])
                        setError(null)
                      }}
                    />
                  </section>
                )}
              </div>
            </div>
          )}

          {activeStep === 'confirm' && (
            <div className="odm-card" style={{ marginBottom: 14 }}>
              <div className="odm-card-header">{t.readyToAssign}</div>
              <div className="odm-card-body odm-mgr-review-location-grid">
                <div>
                  <div className="odm-mgr-review-hint">{t.orderTitle}</div>
                  <strong>{current.orderTitle ?? '—'}</strong>
                </div>
                <div>
                  <div className="odm-mgr-review-hint">{t.missionImplementation}</div>
                  <strong>{current.missionCode}</strong>
                </div>
                <div>
                  <div className="odm-mgr-review-hint">{t.selectedStaff}</div>
                  <strong>{t.staffCountSummary(selectedStaffIds.length)}</strong>
                </div>
                <div>
                  <div className="odm-mgr-review-hint">{t.step2}</div>
                  <strong>
                    {selectedDrones.length > 0
                      ? selectedDrones.map((drone) => drone.label).join(', ')
                      : '—'}
                  </strong>
                </div>
                <div style={{ gridColumn: '1 / -1', color: 'var(--tx3)' }}>
                  {t.confirmBody}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="odm-mgr-modal-error">
              {error}
            </div>
          )}
          <div className="odm-mgr-dispatch-bottombar">
            <button
              type="button"
              className="odm-btn"
              disabled={activeStepIndex === 0}
              onClick={goPrevious}
              style={{
                minHeight: 42,
                padding: '0 20px',
                borderRadius: 9,
                background: '#fff',
                borderColor: '#d8dee9',
              }}
            >
              {t.previous}
            </button>
            <span
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                color: '#64748b',
                fontSize: 14,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-grid',
                  placeItems: 'center',
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                i
              </span>
              {activeStep === 'order' ? t.orderFooterHint : t.footerHint}
            </span>
            {activeStep !== 'confirm' ? (
              <button
                type="button"
                className="odm-btn odm-btn-p"
                onClick={goNext}
                style={{
                  minHeight: 42,
                  padding: '0 22px',
                  borderRadius: 9,
                  background: '#2563eb',
                }}
              >
                {t.next}
              </button>
            ) : (
              <button
                type="button"
                className="odm-btn odm-btn-ok"
                disabled={busy || droneIds.length === 0 || !hasAllRoles}
                onClick={() => void assign()}
                style={{
                  minHeight: 42,
                  padding: '0 22px',
                  borderRadius: 9,
                }}
              >
                {busy ? t.assigning : t.assign}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
