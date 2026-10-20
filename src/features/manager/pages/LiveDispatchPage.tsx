import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { env } from '../../../config/env'
import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { displayOrderCode } from '../../../shared/lib/orderCode'
import {
  SIMULATION_MAP_DEFAULT_CROP,
  simulationMapAspectRatio,
  simulationMapImageStyle,
  worldToViewportPercent,
} from '../../../shared/lib/simulationMapProjection'
import { missionApi } from '../../mission/api/missionApi'
import { droneApi, type AvailableDrone } from '../../staff/api/droneApi'
import {
  operatorApi,
  type AvailableOperator,
} from '../../staff/api/operatorApi'
import { ManagerIcon } from '../components/ManagerIcon'
import { OrderIcon } from '../components/orderReview/OrderIcon'
import { OrderWorkflowStepper } from '../components/OrderWorkflowStepper'
import { managerHref } from '../routes'
import {
  planningError,
  resourceAssignmentConflict,
} from '../lib/planningErrors'
import { ApiError } from '../../../shared/api/httpClient'
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
const dispatchSteps: DispatchStep[] = [
  'order',
  'mission',
  'staff',
  'device',
  'confirm',
]

const stepSubtitles: Record<
  DispatchStep,
  keyof (typeof liveDispatchPageMessages)['vi']
> = {
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

function requestedWindow(current: {
  orderPreferredDateFrom?: string | null
  orderPreferredDateTo?: string | null
  orderPreferredTimeName?: string | null
}) {
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

function staffInitials(staff: AvailableOperator) {
  const source = staff.fullName || staff.email || '?'
  const parts = source.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2)
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
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
    <div
      ref={rootRef}
      style={{ position: 'relative', display: 'grid', gap: 8 }}
    >
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
                    <span
                      style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#0f172a',
                      }}
                    >
                      {selected.fullName}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        marginTop: 2,
                        fontSize: 12,
                        color: '#64748b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
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
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <ManagerIcon name="maintenance" size={16} />
            {t.chooseStaff}
          </span>
          <span aria-hidden="true" style={{ color: '#94a3b8' }}>
            ⌄
          </span>
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
                      background: isSelected
                        ? '#eff6ff'
                        : isActive
                          ? '#f8fafc'
                          : '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <StaffAvatar staff={item} />
                    <span style={{ minWidth: 0 }}>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
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
                      <span
                        style={{
                          display: 'block',
                          marginTop: 2,
                          fontSize: 12,
                          color: '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.email}
                      </span>
                      <span style={{ display: 'block', marginTop: 5 }}>
                        <StaffStatusBadge />
                      </span>
                    </span>
                    <span
                      style={{
                        color: isSelected ? '#2563eb' : 'transparent',
                        fontSize: 18,
                        fontWeight: 900,
                      }}
                    >
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
    <div
      ref={rootRef}
      style={{ position: 'relative', display: 'grid', gap: 10 }}
    >
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
              const model = modelPart
                ? modelPart.replace(/\)$/, '')
                : t.unknownModel
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
                    <span
                      style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#0f172a',
                      }}
                    >
                      {serial || t.device}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        marginTop: 2,
                        fontSize: 12,
                        color: '#64748b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
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
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <ManagerIcon name="drones" size={16} />
            {t.chooseDroneOption}
          </span>
          <span aria-hidden="true" style={{ color: '#94a3b8' }}>
            ⌄
          </span>
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
                      background: isSelected
                        ? '#eff6ff'
                        : isActive
                          ? '#f8fafc'
                          : '#fff',
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
                      <span
                        style={{
                          display: 'block',
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#0f172a',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {serial || t.device}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          marginTop: 2,
                          fontSize: 12,
                          color: '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {model}
                      </span>
                      <span style={{ display: 'block', marginTop: 5 }}>
                        <StaffStatusBadge />
                      </span>
                    </span>
                    <span
                      style={{
                        color: isSelected ? '#2563eb' : 'transparent',
                        fontSize: 18,
                        fontWeight: 900,
                      }}
                    >
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

/** Resource-assignment sub-steps only; Order and Mission context come from the parent workflow. */
const resourceSteps: DispatchStep[] = ['staff', 'device', 'confirm']

export function DispatchWizardTabs({
  activeStep,
  onStep,
  selectionOnly = false,
}: {
  activeStep: DispatchStep
  onStep: (step: DispatchStep) => void
  selectionOnly?: boolean
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  const activeStepIndex = resourceSteps.indexOf(activeStep)
  const stepLabels: Record<DispatchStep, string> = {
    order: t.orderTab,
    mission: t.missionTab,
    staff: t.staffTab,
    device: t.deviceTab,
    confirm: t.confirmTab,
  }
  return (
    <nav className="odm-or-card odm-or-tabs" aria-label={t.tabsAria}>
      <span className="odm-or-tabs-title">{t.resourceTabsTitle}</span>
      {resourceSteps.map((step, index) => (
        <button
          key={step}
          type="button"
          className={`odm-or-tab${activeStep === step ? ' is-active' : ''}${
            index < activeStepIndex ? ' is-done' : ''
          }`}
          aria-current={activeStep === step ? 'step' : undefined}
          disabled={selectionOnly}
          onClick={() => onStep(step)}
        >
          <span className="odm-or-tab-dot">
            {index < activeStepIndex ? (
              <OrderIcon name="check" size={14} />
            ) : (
              index + 1
            )}
          </span>
          <span className="odm-or-tab-text">
            <span className="odm-or-tab-label">{stepLabels[step]}</span>
            <span className="odm-or-tab-hint">
              {t[stepSubtitles[step]] as string}
            </span>
          </span>
        </button>
      ))}
    </nav>
  )
}
export type OrderDispatchContext = {
  orderId: string
  embeddedInOrderReview?: boolean
  missionScoped: boolean
  returnLabel: string
  initialStep: 'staff' | 'device' | 'confirm'
  canAssign: boolean
  missionSelection: ReactNode
  onMissionNext: () => boolean
  onReturn: (toOrigin?: boolean) => void
  onAssigned: () => void
  /** Reports the 8-step order workflow step (6 = resources, 7 = confirm). */
  onGlobalStep?: (step: 6 | 7) => void
  onChanged: () => void
  onDraftState: (dirty: boolean, busy: boolean) => void
  initialDevices: string[]
  initialStaff: Partial<Record<MissionStaffRole, string[]>>
  assignedPeople: AvailableOperator[]
  assignedDevices: AvailableDrone[]
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
}

/** Real resource assignment in the existing manager shell; no invented ranking data. */
export function LiveDispatchPage(props: {
  missionId: string
  orderContext?: OrderDispatchContext
}) {
  return <LiveDispatchContent key={props.missionId} {...props} />
}

function LiveDispatchContent({
  missionId,
  orderContext,
}: {
  missionId: string
  orderContext?: OrderDispatchContext
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  const mission = useApiQuery(
    () => missionApi.getMissionById(missionId),
    [missionId, orderContext?.scheduledStartAt, orderContext?.scheduledEndAt],
  )
  const currentMission =
    mission.data?.id === missionId ? mission.data : undefined
  const start = currentMission?.scheduledStartAt
  const end = currentMission?.scheduledEndAt
  const scope = JSON.stringify([missionId, start, end])
  const validWindow = Boolean(
    start && end && new Date(start).getTime() < new Date(end).getTime(),
  )
  const availability = useApiQuery(async () => {
    if (!validWindow) return null
    const [devices, people] = await Promise.all([
      droneApi.getAvailable(missionId),
      operatorApi.getAvailable(missionId),
    ])
    return { scope, devices, people }
  }, [scope, validWindow])
  const resourcesReady =
    !mission.loading &&
    !mission.error &&
    validWindow &&
    !availability.loading &&
    !availability.error &&
    availability.data?.scope === scope
  const drones = {
    data: resourcesReady ? availability.data?.devices : undefined,
    reload: availability.reload,
  }
  const operators = {
    data: resourcesReady ? availability.data?.people : undefined,
    reload: availability.reload,
  }
  const [droneIds, setDroneIds] = useState<string[]>(
    orderContext?.initialDevices ?? [],
  )
  const [staffByRole, setStaffByRole] = useState<
    Partial<Record<MissionStaffRole, string[]>>
  >(orderContext?.initialStaff ?? {})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<DispatchStep>(
    orderContext?.initialStep ?? 'staff',
  )
  const [openStaffRole, setOpenStaffRole] = useState<MissionStaffRole | null>(
    null,
  )
  const [devicePickerOpen, setDevicePickerOpen] = useState(false)
  const conflictStep = useRef<'staff' | 'device' | null>(null)
  useEffect(() => {
    if (!resourcesReady) return
    const deviceSet = new Set(availability.data?.devices.map((item) => item.id))
    const staffSet = new Set(availability.data?.people.map((item) => item.id))
    const deviceInvalid = droneIds.some((id) => !deviceSet.has(id))
    const staffInvalid = missionRoles.some((role) =>
      (staffByRole[role] ?? []).some((id) => !staffSet.has(id)),
    )
    if (deviceInvalid)
      setDroneIds((ids) => ids.filter((id) => deviceSet.has(id)))
    if (staffInvalid)
      setStaffByRole((crew) =>
        Object.fromEntries(
          missionRoles.map((role) => [
            role,
            (crew[role] ?? []).filter((id) => staffSet.has(id)),
          ]),
        ),
      )
    if (deviceInvalid || staffInvalid || conflictStep.current) {
      const step =
        conflictStep.current === 'device'
          ? 'device'
          : staffInvalid
            ? 'staff'
            : deviceInvalid
              ? 'device'
              : conflictStep.current!
      setActiveStep(step)
      setOpenStaffRole(null)
      setDevicePickerOpen(false)
      setError(
        deviceInvalid || staffInvalid
          ? step === 'staff'
            ? t.staffAvailabilityChanged
            : t.deviceAvailabilityChanged
          : t.resourceAvailabilityChanged,
      )
      conflictStep.current = null
    }
  }, [
    resourcesReady,
    availability.data,
    droneIds,
    staffByRole,
    t.staffAvailabilityChanged,
    t.deviceAvailabilityChanged,
    t.resourceAvailabilityChanged,
  ])

  const selectedStaffIds = missionRoles.flatMap(
    (role) => staffByRole[role] ?? [],
  )
  const hasAllRoles = missionRoles.every(
    (role) => (staffByRole[role] ?? []).length > 0,
  )

  const dirty = Boolean(
    orderContext &&
    (JSON.stringify(droneIds) !== JSON.stringify(orderContext.initialDevices) ||
      missionRoles.some(
        (role) =>
          JSON.stringify(staffByRole[role] ?? []) !==
          JSON.stringify(orderContext.initialStaff[role] ?? []),
      )),
  )
  const draftCallback = orderContext?.onDraftState
  useEffect(() => {
    draftCallback?.(dirty, busy)
  }, [dirty, busy, draftCallback])
  const globalStepCallback = orderContext?.onGlobalStep
  useEffect(() => {
    globalStepCallback?.(activeStep === 'confirm' ? 7 : 6)
  }, [activeStep, globalStepCallback])

  async function assign() {
    if (
      busy ||
      !resourcesReady ||
      (orderContext &&
        (!orderContext.canAssign ||
          mission.data?.id !== missionId ||
          mission.data.orderId !== orderContext.orderId))
    )
      return
    if (droneIds.length === 0 || !hasAllRoles) {
      setError(t.selectDroneAndOperator)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await missionApi.assignResources(missionId, droneIds, staffByRole)
      orderContext?.onAssigned()
      mission.reload()
      availability.reload()
    } catch (cause) {
      setError(planningError(cause))
      if (resourceAssignmentConflict(cause)) {
        conflictStep.current =
          cause instanceof ApiError && cause.path.includes('assign-device')
            ? 'device'
            : 'staff'
        setActiveStep(conflictStep.current)
      }
      orderContext?.onChanged()
      availability.reload()
      mission.reload()
    } finally {
      setBusy(false)
    }
  }

  if (
    mission.loading ||
    availability.loading ||
    (validWindow && !availability.error && availability.data?.scope !== scope)
  ) {
    return (
      <div className="odm-mgr-dash" role="status">
        {activeStep === 'device' ? t.checkingDevices : t.checkingStaff}
      </div>
    )
  }
  if (mission.error || availability.error || !mission.data || !resourcesReady) {
    return (
      <StateView
        state="error"
        title={t.loadError}
        error={
          new Error(
            !validWindow
              ? t.scheduleRequired
              : 'Không thể tải nguồn lực của nhiệm vụ này. Vui lòng thử lại.',
          )
        }
        onRetry={() => {
          mission.reload()
          availability.reload()
        }}
      />
    )
  }

  const current = mission.data
  if (
    orderContext &&
    (current.id !== missionId ||
      current.orderId !== orderContext.orderId ||
      !['RESOURCE_ASSIGNING', 'WAITING_CREW_CONFIRMATION'].includes(
        current.status,
      ))
  )
    return (
      <section className="odm-or-card odm-or-card-body">
        <p role="alert">
          Nhiệm vụ không còn đủ điều kiện phân công trong Order này. Vui lòng
          chọn lại nhiệm vụ.
        </p>
        <button
          className="odm-or-btn-outline"
          onClick={() => orderContext.onReturn()}
        >
          {orderContext.missionScoped
            ? orderContext.returnLabel
            : 'Chọn nhiệm vụ khác'}
        </button>
      </section>
    )
  const currentOrderCode = displayOrderCode(current.orderCode, current.orderId)
  const assignable = orderContext
    ? ['RESOURCE_ASSIGNING', 'WAITING_CREW_CONFIRMATION'].includes(
        current.status,
      )
    : current.status === 'RESOURCE_ASSIGNING' || current.status === 'CREATED'
  const activeStepIndex = dispatchSteps.indexOf(activeStep)
  const selectedDrones = (drones.data ?? []).filter((drone) =>
    droneIds.includes(drone.id),
  )
  const assignedDeviceText =
    selectedDrones.length > 0
      ? selectedDrones.map((drone) => drone.label).join(', ')
      : (current.droneCode ??
        current.deviceCode ??
        current.deviceId ??
        current.droneId ??
        '—')
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
  const goNext = () => {
    if (activeStep === 'mission' && orderContext) {
      if (orderContext.onMissionNext()) setActiveStep('staff')
      return
    }
    setActiveStep(
      dispatchSteps[Math.min(activeStepIndex + 1, dispatchSteps.length - 1)],
    )
  }
  const goPrevious = () => {
    if (activeStep === 'staff' && orderContext) {
      orderContext.onReturn()
      return
    }
    setActiveStep(dispatchSteps[Math.max(activeStepIndex - 1, 0)])
  }
  const globalStep = activeStep === 'confirm' ? 7 : 6
  const roleSummary = missionRoles.map((role) => ({
    role,
    names: (staffByRole[role] ?? [])
      .map(
        (id) => (operators.data ?? []).find((item) => item.id === id)?.fullName,
      )
      .filter(Boolean) as string[],
  }))
  const missingRoles = roleSummary.filter(
    (item) => item.names.length === 0,
  ).length
  const missingRoleNames = roleSummary
    .filter((item) => item.names.length === 0)
    .map((item) => t.roles[item.role])
  const stepHint: Record<DispatchStep, string> = {
    order: t.orderFooterHint,
    mission: t.missionFooterHint,
    staff: t.staffFooterHint,
    device: t.deviceFooterHint,
    confirm: t.footerHint,
  }
  const scheduleText = `${fmtDateTime(current.scheduledStartAt)}${
    current.scheduledEndAt ? ` → ${fmtDateTime(current.scheduledEndAt)}` : ''
  }`

  return (
    <div className="odm-or">
      {!orderContext?.embeddedInOrderReview && <div className="odm-or-pagehead odm-or-pagehead-row">
        <div>
          <h1 className="odm-or-title">{t.createMissionTitle}</h1>
          <p className="odm-or-subtitle">{t.createMissionSubtitle}</p>
          {orderContext && (
            <span className="odm-or-pill odm-or-pill-blue">
              {current.missionCode}
            </span>
          )}
        </div>
        {orderContext ? (
          <button
            className="odm-or-btn-outline"
            disabled={busy}
            onClick={() => orderContext.onReturn()}
          >
            {orderContext.missionScoped
              ? orderContext.returnLabel
              : 'Chọn nhiệm vụ khác'}
          </button>
        ) : (
          <a
            className="odm-or-btn-outline"
            href={managerHref({ screen: 'orderQueue' })}
          >
            {t.backToOrders}
          </a>
        )}
      </div>}

      {!assignable ? (
        <>
          <OrderWorkflowStepper currentStep={8} />
          <section className="odm-or-card">
            <div className="odm-or-card-body odm-or-result">
              <span className="odm-or-result-icon" aria-hidden="true">
                <OrderIcon name="check" size={26} />
              </span>
              <h2 className="odm-or-result-title">{t.assignedTitle}</h2>
              <p className="odm-or-muted">
                {t.assignedBody(
                  current.missionCode,
                  missionStatusLabel(current.status, t.missionStatuses),
                )}
              </p>
              <dl className="odm-or-summary-list odm-or-result-list">
                <div>
                  <dt>
                    <OrderIcon name="calendar" size={16} />
                    {t.scheduleLabel}
                  </dt>
                  <dd>{scheduleText}</dd>
                </div>
                <div>
                  <dt>
                    <OrderIcon name="drone" size={16} />
                    {t.assignedDevice}
                  </dt>
                  <dd>{assignedDeviceText}</dd>
                </div>
              </dl>
              <div className="odm-or-result-actions">
                <a
                  className="odm-or-btn odm-or-btn-ghost"
                  href={managerHref({ screen: 'orderQueue' })}
                >
                  {t.backToOrders}
                </a>
                <a
                  className="odm-or-btn odm-or-btn-primary"
                  href={managerHref({
                    screen: 'missions',
                    missionId: current.id,
                  })}
                >
                  {t.viewMission}
                  <OrderIcon name="chevron-right" size={16} />
                </a>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {!orderContext?.embeddedInOrderReview && (
            <OrderWorkflowStepper currentStep={globalStep} />
          )}

          <DispatchWizardTabs
            activeStep={activeStep}
            onStep={(step) => setActiveStep(step)}
          />

          {activeStep === 'order' && (
            <section className="odm-or-card">
              <header className="odm-or-card-head">
                <span className="odm-or-card-title">
                  <OrderIcon name="doc" size={18} />
                  {t.orderInfoTitle}
                </span>
              </header>
              <div
                className={`odm-or-card-body odm-or-order-body${target ? ' has-map' : ''}`}
              >
                <dl className="odm-or-summary-list">
                  <div>
                    <dt>
                      <OrderIcon name="tag" size={16} />
                      {t.orderId}
                    </dt>
                    <dd>{currentOrderCode}</dd>
                  </div>
                  <div>
                    <dt>
                      <OrderIcon name="user" size={16} />
                      {t.customer}
                    </dt>
                    <dd>{current.customerName ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>
                      <OrderIcon name="service" size={16} />
                      {t.service}
                    </dt>
                    <dd>{current.serviceName ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>
                      <OrderIcon name="radius" size={16} />
                      {t.areaRadius}
                    </dt>
                    <dd>{fmtRadius(current.radiusM)}</dd>
                  </div>
                  <div>
                    <dt>
                      <OrderIcon name="calendar" size={16} />
                      {t.customerDeadline}
                    </dt>
                    <dd>{requestedWindow(current)}</dd>
                  </div>
                  <div>
                    <dt>
                      <OrderIcon name="media" size={16} />
                      {t.orderTitle}
                    </dt>
                    <dd>{current.orderTitle ?? '—'}</dd>
                  </div>
                </dl>
                {target && (
                  <div
                    className="odm-or-map odm-or-map-compact"
                    style={{
                      aspectRatio: simulationMapAspectRatio(
                        SIMULATION_MAP_IMAGE_CROP,
                      ),
                    }}
                  >
                    <div
                      className="odm-or-map-layer"
                      style={{ left: 0, top: 0, width: '100%', height: '100%' }}
                    >
                      <img
                        className="odm-or-map-image"
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
                          className="odm-or-map-radius"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                      <span
                        className="odm-or-map-pin"
                        style={{ left: `${target.x}%`, top: `${target.y}%` }}
                        aria-hidden="true"
                      >
                        <svg width="26" height="33" viewBox="0 0 30 38">
                          <path
                            d="M15 37C15 37 3 24.5 3 14.5a12 12 0 0 1 24 0C27 24.5 15 37 15 37z"
                            fill="#1677ff"
                            stroke="#fff"
                            strokeWidth="2"
                          />
                          <circle cx="15" cy="14.5" r="4.5" fill="#fff" />
                        </svg>
                      </span>
                      <span
                        className="odm-or-map-badge"
                        style={{ left: `${target.x}%`, top: `${target.y}%` }}
                      >
                        X {current.longitude?.toFixed(1) ?? '—'} · Y{' '}
                        {current.latitude?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeStep === 'mission' &&
            orderContext &&
            orderContext.missionSelection}
          {activeStep === 'mission' && !orderContext && (
            <section className="odm-or-card">
              <header className="odm-or-card-head">
                <span className="odm-or-card-title">
                  <OrderIcon name="service" size={18} />
                  {t.missionImplementation}
                </span>
              </header>
              <dl className="odm-or-card-body odm-or-summary-list">
                <div>
                  <dt>
                    <OrderIcon name="tag" size={16} />
                    {t.missionHeader(current.missionCode)}
                  </dt>
                  <dd>{current.missionCode}</dd>
                </div>
                <div>
                  <dt>
                    <OrderIcon name="info" size={16} />
                    {t.status}
                  </dt>
                  <dd>
                    <span className="odm-or-pill odm-or-pill-blue">
                      {missionStatusLabel(current.status, t.missionStatuses)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>
                    <OrderIcon name="calendar" size={16} />
                    {t.actualSchedule}
                  </dt>
                  <dd>{scheduleText}</dd>
                </div>
              </dl>
            </section>
          )}

          {activeStep === 'staff' && (
            <section className="odm-or-card">
              <header className="odm-or-card-head">
                <span className="odm-or-card-title">
                  <OrderIcon name="users" size={18} />
                  {t.step1}
                </span>
                <span
                  className={`odm-or-pill ${missingRoles === 0 ? 'odm-or-pill-green' : 'odm-or-pill-amber'}`}
                >
                  {missingRoles === 0
                    ? t.rolesComplete
                    : t.rolesMissing(missingRoles)}
                </span>
              </header>
              <div
                className="odm-or-card-body"
                style={{ display: 'grid', gap: 14 }}
              >
                {current && (
                  <p className="odm-assign-mission">
                    <strong>{current.missionCode}</strong>
                    <span>{scheduleText}</span>
                  </p>
                )}
                <p className="odm-or-muted" style={{ margin: 0 }}>
                  {t.roleHelp} {t.staffAvailabilityHint}
                </p>
                <div className="odm-or-role-grid">
                  {missionRoles.map((role) => {
                    const selected = staffByRole[role] ?? []
                    return (
                      <section
                        key={role}
                        className={`odm-or-role-card${selected.length > 0 ? ' is-filled' : ''}`}
                      >
                        <span className="odm-or-role-head">
                          <span>
                            {t.roleIcons[role]} {t.roles[role]}
                          </span>
                          {selected.length > 0 && (
                            <span className="odm-or-role-check">
                              <OrderIcon name="check" size={16} />
                            </span>
                          )}
                        </span>
                        <span className="odm-or-muted" style={{ fontSize: 12 }}>
                          {t.roleDescriptions[role]}
                        </span>
                        {selected.length > 0 &&
                          missionRoles.some(
                            (other) => (staffByRole[other] ?? []).length === 0,
                          ) && (
                            <button
                              type="button"
                              className="odm-or-link-btn odm-or-bulk-assign"
                              onClick={() => {
                                setStaffByRole(
                                  Object.fromEntries(
                                    missionRoles.map((other) => [
                                      other,
                                      (staffByRole[other] ?? []).length > 0
                                        ? staffByRole[other]
                                        : [selected[0]],
                                    ]),
                                  ) as typeof staffByRole,
                                )
                                setError(null)
                              }}
                            >
                              Dùng người này cho các vai trò còn trống
                            </button>
                          )}
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
                              const currentIds = cur[role] ?? []
                              const nextRoleStaff = currentIds.includes(staffId)
                                ? currentIds.filter((id) => id !== staffId)
                                : [...currentIds, staffId]
                              return { ...cur, [role]: nextRoleStaff }
                            })
                            setError(null)
                          }}
                          onRemove={(staffId) => {
                            setStaffByRole((cur) => ({
                              ...cur,
                              [role]: (cur[role] ?? []).filter(
                                (id) => id !== staffId,
                              ),
                            }))
                            setError(null)
                          }}
                        />
                      </section>
                    )
                  })}
                </div>
                {!operators.data?.length && (
                  <p className="odm-or-empty">{t.noAvailableOperators}</p>
                )}
                {selectedStaffIds.length > 0 && (
                  <div className="odm-or-chips">
                    <strong>{t.selectedStaff}</strong>
                    {missionRoles.flatMap((role) =>
                      (staffByRole[role] ?? []).map((selectedId) => {
                        const staff = (operators.data ?? []).find(
                          (item) => item.id === selectedId,
                        )
                        if (!staff) return null
                        return (
                          <span
                            key={`${role}-${selectedId}`}
                            className="odm-or-chip"
                          >
                            <b>{t.roles[role]}</b>
                            {staff.fullName}
                            <button
                              type="button"
                              className="odm-or-chip-x"
                              onClick={() =>
                                setStaffByRole((cur) => ({
                                  ...cur,
                                  [role]: (cur[role] ?? []).filter(
                                    (id) => id !== selectedId,
                                  ),
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
                      className="odm-or-link-btn"
                      onClick={() => setStaffByRole({})}
                    >
                      {t.clearAll}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeStep === 'device' && (
            <section className="odm-or-card">
              <header className="odm-or-card-head">
                <span className="odm-or-card-title">
                  <OrderIcon name="drone" size={18} />
                  {t.step2}
                </span>
                {selectedDrones.length > 0 && (
                  <span className="odm-or-pill odm-or-pill-blue">
                    {t.deviceSelectedCount(selectedDrones.length)}
                  </span>
                )}
              </header>
              <div
                className="odm-or-card-body"
                style={{ display: 'grid', gap: 14 }}
              >
                <p className="odm-or-muted" style={{ margin: 0 }}>
                  {t.deviceHelp} {t.deviceAvailabilityHint}
                </p>
                {!drones.data?.length ? (
                  <p className="odm-or-empty">{t.noAvailableDrones}</p>
                ) : (
                  <section className="odm-or-device-box">
                    <div
                      className="odm-or-role-head"
                      style={{ marginBottom: 10 }}
                    >
                      <span>
                        <b>{t.selectedDevice}</b>
                        <span
                          className="odm-or-muted"
                          style={{ display: 'block', fontSize: 13 }}
                        >
                          {selectedDrones.length > 0
                            ? t.deviceSelectedCount(selectedDrones.length)
                            : t.chooseDroneOption}
                        </span>
                      </span>
                      {selectedDrones.length > 0 && (
                        <span className="odm-or-role-check">
                          <OrderIcon name="check" size={16} />
                        </span>
                      )}
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
                        setDroneIds((currentIds) =>
                          currentIds.filter((id) => id !== deviceId),
                        )
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
            </section>
          )}

          {activeStep === 'confirm' && (
            <section className="odm-or-card">
              <header className="odm-or-card-head">
                <span className="odm-or-card-title">
                  <OrderIcon name="check" size={18} />
                  {t.readyToAssign}
                </span>
              </header>
              <div
                className="odm-or-card-body"
                style={{ display: 'grid', gap: 16 }}
              >
                <p className="odm-or-muted" style={{ margin: 0 }}>
                  {t.confirmBody}
                </p>
                <dl className="odm-or-summary-list">
                  <div>
                    <dt>
                      <OrderIcon name="doc" size={16} />
                      {t.orderTitle}
                    </dt>
                    <dd>{current.orderTitle ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>
                      <OrderIcon name="service" size={16} />
                      {t.missionImplementation}
                    </dt>
                    <dd>{current.missionCode}</dd>
                  </div>
                  <div>
                    <dt>
                      <OrderIcon name="calendar" size={16} />
                      {t.scheduleLabel}
                    </dt>
                    <dd>{scheduleText}</dd>
                  </div>
                  {roleSummary.map((item) => (
                    <div key={item.role}>
                      <dt>
                        <OrderIcon name="user" size={16} />
                        {t.roles[item.role]}
                      </dt>
                      <dd>
                        {item.names.length > 0
                          ? item.names.join(', ')
                          : t.notSelected}
                      </dd>
                    </div>
                  ))}
                  <div>
                    <dt>
                      <OrderIcon name="drone" size={16} />
                      {t.step2}
                    </dt>
                    <dd>
                      {selectedDrones.length > 0
                        ? selectedDrones.map((drone) => drone.label).join(', ')
                        : t.notSelected}
                    </dd>
                  </div>
                </dl>
                <ul className="odm-or-checklist" aria-label={t.checklist}>
                  <li className={missingRoles === 0 ? 'is-ok' : 'is-bad'}>
                    <OrderIcon
                      name={missingRoles === 0 ? 'check' : 'alert'}
                      size={16}
                    />
                    {missingRoles === 0
                      ? t.rolesComplete
                      : t.rolesMissing(missingRoles)}
                  </li>
                  <li
                    className={selectedDrones.length > 0 ? 'is-ok' : 'is-bad'}
                  >
                    <OrderIcon
                      name={selectedDrones.length > 0 ? 'check' : 'alert'}
                      size={16}
                    />
                    {selectedDrones.length > 0
                      ? t.deviceSelectedCount(selectedDrones.length)
                      : t.deviceMissing}
                  </li>
                </ul>
              </div>
            </section>
          )}

          {error && (
            <div role="alert" className="odm-or-error">
              {error}
            </div>
          )}

          <div className="odm-or-actionbar">
            <div className="odm-or-actionbar-hint">
              <span className="odm-or-actionbar-hint-icon">
                <OrderIcon name="info" size={18} />
              </span>
              <span>{stepHint[activeStep]}</span>
              {activeStep === 'staff' && missingRoleNames.length > 0 && (
                <strong className="odm-or-actionbar-missing">
                  Còn thiếu: {missingRoleNames.join(', ')}
                </strong>
              )}
            </div>
            <div className="odm-or-actionbar-actions">
              <button
                type="button"
                className="odm-or-btn odm-or-btn-ghost"
                disabled={activeStepIndex === 0}
                onClick={goPrevious}
              >
                {t.previous}
              </button>
              {activeStep !== 'confirm' ? (
                <button
                  type="button"
                  className={`odm-or-btn odm-or-btn-blue${
                    (activeStep === 'staff' && missingRoles > 0) ||
                    (activeStep === 'device' && selectedDrones.length === 0)
                      ? ' is-blocked'
                      : ''
                  }`}
                  onClick={goNext}
                >
                  {t.next}
                  <OrderIcon name="chevron-right" size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="odm-or-btn odm-or-btn-primary"
                  disabled={
                    busy ||
                    droneIds.length === 0 ||
                    !hasAllRoles ||
                    (orderContext && !orderContext.canAssign)
                  }
                  onClick={() => void assign()}
                >
                  {busy ? t.assigning : t.assign}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
