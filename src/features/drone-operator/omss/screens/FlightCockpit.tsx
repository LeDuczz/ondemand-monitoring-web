import { useEffect, useState, type ReactNode } from 'react'
import './FlightCockpit.css'

export type CockpitCommand =
  | 'takeoff'
  | 'gps_target_start'
  | 'stop'
  | 'photo'
  | 'return_to_base'
  | 'land'
  | 'emergency_stop'

export type CockpitTelemetry = {
  latitude: number | null
  longitude: number | null
  altitudeM: number | null
  speedMps: number | null
  verticalMps: number | null
  headingDeg: number | null
  rollDeg?: number | null
  pitchDeg?: number | null
  batteryPercent: number | null
  inAir: boolean
  flightMode: string | null
  baseDistanceKm: number | null
  targetDistanceKm: number | null
}

type Props = {
  language: 'vi' | 'en'
  missionLabel: string
  roleLabel: string
  liveLabel: string
  online: boolean
  waitingGpsLabel: string
  statusMessage: string
  telemetry: CockpitTelemetry
  camera: ReactNode
  map: ReactNode
  overlay?: ReactNode
  busy: boolean
  canFly: boolean
  canFlyToTarget: boolean
  /** @deprecated reference-photo button was removed; the Photo control captures instead */
  referenceBusy?: boolean
  onCommand: (command: CockpitCommand) => void
  onReview: () => void
  onFinishFlight?: () => void
  finishingFlight?: boolean
  onReferenceCapture?: () => void
}

const copy = {
  vi: {
    brand: 'Buồng lái bay', brandSub: 'Drone Mission Control', flightTime: 'Thời gian bay',
    link: 'Kết nối', linkOk: 'Trực tuyến', linkOff: 'Mất kết nối', battery: 'Pin',
    review: 'Xem lại', reference: 'Ảnh tham chiếu', referenceBusy: 'Đang lấy…', fullscreen: 'Toàn màn hình',
    layout: 'Bố cục', layoutSplit: 'Chia đôi', layoutCamera: 'Camera lớn', layoutMap: 'Bản đồ lớn', enlarge: 'Phóng to', shrink: 'Thu nhỏ về chia đôi',
    camera: 'Camera trực tiếp', map: 'Bản đồ nhiệm vụ', params: 'Thông số bay', control: 'Điều khiển',
    roll: 'Nghiêng', pitch: 'Chúi', heading: 'Hướng mũi', altitude: 'Độ cao', speed: 'Tốc độ ngang',
    vertical: 'Lên / xuống', toBase: 'Tới trạm (Home)', toTarget: 'Tới điểm (Target)', mode: 'Chế độ',
    flying: 'Đang bay', ground: 'Dưới đất', route: 'Đường bay', zone: 'Vùng cấm bay', target: 'Điểm mục tiêu', drone: 'Drone',
    takeoff: 'Cất cánh', takeoffSub: 'Lên độ cao bay', fly: 'Bay tới điểm', flySub: 'Điểm khách chọn',
    pause: 'Tạm dừng', pauseSub: 'Giữ vị trí', photo: 'Chụp ảnh', photoSub: 'Lưu vào thẻ nhớ',
    rtl: 'Quay về', rtlSub: 'RTL', land: 'Hạ cánh', landSub: 'Xuống an toàn',
    finishFlight: 'Hoàn thành bay', finishFlightSub: 'Chuyển postcheck',
    emergency: 'Dừng khẩn cấp', emergencySub: 'Ngắt động cơ ngay lập tức', emergencyConfirm: 'Bấm lần nữa để xác nhận',
  },
  en: {
    brand: 'Flight cockpit', brandSub: 'Drone Mission Control', flightTime: 'Flight time',
    link: 'Link', linkOk: 'Online', linkOff: 'Disconnected', battery: 'Battery',
    review: 'Review', reference: 'Reference photo', referenceBusy: 'Fetching…', fullscreen: 'Fullscreen',
    layout: 'Layout', layoutSplit: 'Split', layoutCamera: 'Large camera', layoutMap: 'Large map', enlarge: 'Enlarge', shrink: 'Back to split',
    camera: 'Live camera', map: 'Mission map', params: 'Flight data', control: 'Controls',
    roll: 'Roll', pitch: 'Pitch', heading: 'Heading', altitude: 'Altitude', speed: 'Ground speed',
    vertical: 'Up / down', toBase: 'To home', toTarget: 'To target', mode: 'Mode',
    flying: 'Flying', ground: 'On ground', route: 'Flight path', zone: 'No-fly zone', target: 'Target', drone: 'Drone',
    takeoff: 'Take off', takeoffSub: 'Climb to altitude', fly: 'Fly to point', flySub: 'Customer point',
    pause: 'Pause', pauseSub: 'Hold position', photo: 'Photo', photoSub: 'Save to card',
    rtl: 'Return', rtlSub: 'RTL', land: 'Land', landSub: 'Safe descent',
    finishFlight: 'Finish flight', finishFlightSub: 'Move to postcheck',
    emergency: 'Emergency stop', emergencySub: 'Cut motors immediately', emergencyConfirm: 'Press again to confirm',
  },
}

const ICONS: Record<string, ReactNode> = {
  drone: <><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="18" r="3" /><path d="M8 8l2.5 2.5M16 8l-2.5 2.5M8 16l2.5-2.5M16 16l-2.5-2.5" /><rect x="10" y="10" width="4" height="4" rx="1" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  battery: <><rect x="7" y="4" width="10" height="17" rx="2" /><path d="M10 2h4" /></>,
  review: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></>,
  pin: <><path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" /></>,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  altitude: <><path d="M4 18l8-4 8 4" /><path d="M4 13l8-4 8 4" /><path d="M12 3v6" /></>,
  speed: <><path d="M5 18a8 8 0 1 1 14 0" /><path d="M12 14l4-5" /></>,
  vertical: <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" />,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  home: <><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-5h4v5" /></>,
  mode: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  takeoff: <path d="M12 20V5M6 11l6-6 6 6" />,
  fly: <path d="M3 11l18-8-8 18-2-8z" />,
  pause: <path d="M9 5v14M15 5v14" />,
  photo: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  rtl: <><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /></>,
  land: <path d="M12 4v13M6 11l6 6 6-6M5 21h14" />,
  stop: <><circle cx="12" cy="12" r="9" /><rect x="8.5" y="8.5" width="7" height="7" rx="1" /></>,
}

function Ico({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

function fmt(value: number | null | undefined, digits = 1) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '--'
}

type CockpitLayout = 'split' | 'camera' | 'map'
const LAYOUT_KEY = 'odm.cockpit.layout'

function useCockpitLayout() {
  const [layout, setLayout] = useState<CockpitLayout>(() => {
    try {
      const saved = window.localStorage.getItem(LAYOUT_KEY)
      return saved === 'camera' || saved === 'map' ? saved : 'split'
    } catch { return 'split' }
  })
  useEffect(() => {
    try { window.localStorage.setItem(LAYOUT_KEY, layout) } catch { /* storage unavailable */ }
    // Leaflet only re-measures on window resize, so nudge it after the grid animates.
    const timer = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 280)
    return () => window.clearTimeout(timer)
  }, [layout])
  return [layout, setLayout] as const
}

function useFlightClock(inAir: boolean) {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (inAir && startedAt === null) setStartedAt(Date.now())
  }, [inAir, startedAt])
  useEffect(() => {
    if (!inAir) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [inAir])
  if (startedAt === null) return '00:00:00'
  const total = Math.max(0, Math.floor((now - startedAt) / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}

function AttitudeIndicator({ roll, pitch, label }: { roll: number | null; pitch: number | null; label: string }) {
  const r = roll ?? 0
  const p = Math.max(-30, Math.min(30, pitch ?? 0))
  return (
    <div className="fc-instrument">
      <svg viewBox="0 0 200 200" className="fc-attitude" aria-hidden="true">
        <defs>
          <clipPath id="fc-att-clip"><circle cx="100" cy="100" r="86" /></clipPath>
        </defs>
        <g clipPath="url(#fc-att-clip)">
          <g transform={`rotate(${-r} 100 100) translate(0 ${p * 2.2})`}>
            <rect x="-100" y="-200" width="400" height="300" fill="#2f7fd8" />
            <rect x="-100" y="100" width="400" height="300" fill="#8a5a2b" />
            <line x1="-100" y1="100" x2="300" y2="100" stroke="#fff" strokeWidth="2" />
            {[-20, -10, 10, 20].map((deg) => (
              <g key={deg}>
                <line x1="80" x2="120" y1={100 - deg * 2.2} y2={100 - deg * 2.2} stroke="#fff" strokeWidth="1.6" />
                <text x="126" y={104 - deg * 2.2} fill="#fff" fontSize="10">{Math.abs(deg)}</text>
              </g>
            ))}
          </g>
        </g>
        <circle cx="100" cy="100" r="86" fill="none" stroke="#334155" strokeWidth="6" />
        <path d="M100 18l-6 10h12z" fill="#facc15" />
        <path d="M58 100h26l6 8 6-8h0M110 100h0l6 8 6-8h20" fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="100" cy="100" r="3.5" fill="#facc15" />
      </svg>
      <span>{label}</span>
    </div>
  )
}

function CompassRose({ heading, label }: { heading: number | null; label: string }) {
  const h = heading ?? 0
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10)
  return (
    <div className="fc-instrument">
      <svg viewBox="0 0 200 200" className="fc-compass" aria-hidden="true">
        <circle cx="100" cy="100" r="88" fill="#06101f" stroke="#334155" strokeWidth="4" />
        <g style={{ transform: `rotate(${-h}deg)`, transformOrigin: '100px 100px', transition: 'transform .9s linear' }}>
          {ticks.map((deg) => (
            <line
              key={deg}
              x1="100" x2="100" y1="16" y2={deg % 90 === 0 ? 30 : 24}
              stroke={deg % 90 === 0 ? '#e2e8f0' : '#64748b'} strokeWidth={deg % 90 === 0 ? 2.5 : 1.4}
              transform={`rotate(${deg} 100 100)`}
            />
          ))}
          {(['N', 'E', 'S', 'W'] as const).map((c, i) => (
            <text key={c} x="100" y="46" textAnchor="middle" fontSize="15" fontWeight="800" fill={c === 'N' ? '#f87171' : '#e2e8f0'} transform={`rotate(${i * 90} 100 100)`}>{c}</text>
          ))}
        </g>
        <path d="M100 8l-7 12h14z" fill="#38bdf8" />
        <text x="100" y="112" textAnchor="middle" fontSize="30" fontWeight="800" fill="#f8fafc">{heading === null ? '--' : Math.round(((h % 360) + 360) % 360)}°</text>
      </svg>
      <span>{label}</span>
    </div>
  )
}

function Stat({ icon, label, value, unit, tone }: { icon: string; label: string; value: string; unit?: string; tone?: string }) {
  return (
    <div className={`fc-stat${tone ? ` is-${tone}` : ''}`}>
      <span className="fc-stat__icon"><Ico name={icon} size={22} /></span>
      <div>
        <span className="fc-stat__label">{label}</span>
        <strong>{value}{unit ? <small> {unit}</small> : null}</strong>
      </div>
    </div>
  )
}

export function FlightCockpit(props: Props) {
  const {
    language, missionLabel, roleLabel, liveLabel, online, waitingGpsLabel, statusMessage,
    telemetry: tm, camera, map, overlay, busy, canFly, canFlyToTarget,
    onCommand, onReview, onFinishFlight, finishingFlight,
  } = props
  const c = copy[language]
  const clock = useFlightClock(tm.inAir)
  const [confirmStop, setConfirmStop] = useState(false)
  const [layout, setLayout] = useCockpitLayout()
  useEffect(() => {
    if (!confirmStop) return
    const timer = window.setTimeout(() => setConfirmStop(false), 3000)
    return () => window.clearTimeout(timer)
  }, [confirmStop])

  const battery = tm.batteryPercent
  const batteryTone = battery === null ? 'ok' : battery <= 20 ? 'low' : battery <= 40 ? 'mid' : 'ok'
  const hasGps = tm.latitude !== null && tm.longitude !== null
  const gpsText = hasGps ? `${tm.latitude!.toFixed(6)}, ${tm.longitude!.toFixed(6)}` : waitingGpsLabel

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen?.()
    else void document.documentElement.requestFullscreen?.()
  }

  const controls: Array<{ cmd: CockpitCommand; icon: string; label: string; sub: string; tone?: string; enabled: boolean }> = [
    { cmd: 'takeoff', icon: 'takeoff', label: c.takeoff, sub: c.takeoffSub, enabled: canFly },
    { cmd: 'gps_target_start', icon: 'fly', label: c.fly, sub: c.flySub, tone: 'primary', enabled: canFly && canFlyToTarget },
    { cmd: 'stop', icon: 'pause', label: c.pause, sub: c.pauseSub, enabled: canFly },
    { cmd: 'photo', icon: 'photo', label: c.photo, sub: c.photoSub, enabled: canFly },
    { cmd: 'return_to_base', icon: 'rtl', label: c.rtl, sub: c.rtlSub, enabled: canFly },
    { cmd: 'land', icon: 'land', label: c.land, sub: c.landSub, tone: 'success', enabled: canFly },
  ]

  return (
    <div className="fc-root">
      <header className="fc-header">
        <div className="fc-brand">
          <span className="fc-brand__logo"><Ico name="drone" size={26} /></span>
          <div>
            <strong>{c.brand}</strong>
            <small>{c.brandSub}</small>
          </div>
        </div>

        <div className="fc-header__group">
          <div className="fc-mission">
            <strong>{missionLabel}</strong>
            <small>{roleLabel}</small>
          </div>
          <span className={`fc-live ${online ? 'is-on' : 'is-off'}`}>{liveLabel}</span>
          <div className="fc-clock">
            <strong>{clock}</strong>
            <small>{c.flightTime}</small>
          </div>
        </div>

        <div className="fc-header__group">
          <div className={`fc-chip ${online ? 'is-ok' : 'is-bad'}`}>
            <Ico name="link" size={20} />
            <div><strong>{c.link}</strong><small>{online ? c.linkOk : c.linkOff}</small></div>
          </div>
          <div className={`fc-chip is-${batteryTone === 'ok' ? 'ok' : batteryTone === 'mid' ? 'warn' : 'bad'}`}>
            <Ico name="battery" size={20} />
            <div><strong>{battery === null ? '--' : `${Math.round(battery)}%`}</strong><small>{c.battery}</small></div>
          </div>
          <div className="fc-chip is-info fc-chip--gps">
            <Ico name="pin" size={20} />
            <div><strong className="fc-mono">{gpsText}</strong><small>GPS</small></div>
          </div>
        </div>

        <div className="fc-header__actions">
          <div className="fc-seg" role="group" aria-label={c.layout}>
            {([['split', c.layoutSplit], ['camera', c.layoutCamera], ['map', c.layoutMap]] as const).map(([key, label]) => (
              <button key={key} type="button" className={layout === key ? 'is-active' : ''} aria-pressed={layout === key} onClick={() => setLayout(key)}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="fc-ghost" onClick={onReview} disabled={busy}>
            <Ico name="review" /> {c.review}
          </button>
          <button type="button" className="fc-icon-btn" onClick={toggleFullscreen} aria-label={c.fullscreen} title={c.fullscreen}>
            <Ico name="expand" />
          </button>
        </div>
      </header>

      <main className={`fc-body is-layout-${layout}`}>
        <section className="fc-panel fc-camera">
          <header className="fc-panel__head">
            <span className="fc-panel__title"><i className="fc-dot is-live" />{c.camera}</span>
            <span className="fc-panel__tools">
              <span className={`fc-badge is-${batteryTone}`}><Ico name="battery" size={14} /> {battery === null ? '--' : `${Math.round(battery)}%`}</span>
              <button type="button" className="fc-icon-btn is-sm" onClick={() => setLayout(layout === 'camera' ? 'split' : 'camera')}
                aria-label={layout === 'camera' ? c.shrink : c.enlarge} title={layout === 'camera' ? c.shrink : c.enlarge}>
                <Ico name="expand" size={15} />
              </button>
            </span>
          </header>
          <div className="fc-camera__body">{camera}</div>
        </section>

        <section className="fc-panel fc-map">
          <header className="fc-panel__head">
            <span className="fc-panel__title"><Ico name="pin" size={15} />{c.map}</span>
            <span className="fc-panel__tools">
              {statusMessage ? <span className="fc-status-msg" title={statusMessage}>{statusMessage}</span> : null}
              <button type="button" className="fc-icon-btn is-sm" onClick={() => setLayout(layout === 'map' ? 'split' : 'map')}
                aria-label={layout === 'map' ? c.shrink : c.enlarge} title={layout === 'map' ? c.shrink : c.enlarge}>
                <Ico name="expand" size={15} />
              </button>
            </span>
          </header>
          <div className="fc-map__body">
            {map}
            <div className="fc-legend">
              <strong>{missionLabel}</strong>
              <span><i className="fc-legend__line is-route" />{c.route}</span>
              <span><i className="fc-legend__line is-zone" />{c.zone}</span>
              <span><i className="fc-legend__dot is-drone" />{c.drone}</span>
              <span><i className="fc-legend__dot is-target" />{c.target}</span>
            </div>
          </div>
        </section>

        <aside className="fc-side">
          <section className="fc-panel">
            <header className="fc-panel__head">
              <span className="fc-panel__title is-bar">{c.params}</span>
              <span className={`fc-badge ${tm.inAir ? 'is-ok' : 'is-mid'}`}><i className="fc-dot" />{tm.inAir ? c.flying : c.ground}</span>
            </header>
            <div className="fc-instruments">
              <AttitudeIndicator
                roll={tm.rollDeg ?? null}
                pitch={tm.pitchDeg ?? null}
                label={`${c.roll} ${fmt(tm.rollDeg, 0)}° · ${c.pitch} ${fmt(tm.pitchDeg, 0)}°`}
              />
              <CompassRose heading={tm.headingDeg} label={c.heading} />
            </div>
            <div className="fc-stats">
              <Stat icon="altitude" label={c.altitude} value={fmt(tm.altitudeM)} unit="m" tone="accent" />
              <Stat icon="speed" label={c.speed} value={fmt(tm.speedMps)} unit="m/s" tone="accent" />
              <Stat icon="vertical" label={c.vertical} value={fmt(tm.verticalMps)} unit="m/s" />
              <Stat icon="compass" label={c.heading} value={tm.headingDeg === null ? '--' : `${Math.round(tm.headingDeg)}°`} />
              <Stat icon="home" label={c.toBase} value={fmt(tm.baseDistanceKm, 2)} unit="km" />
              <Stat icon="pin" label={c.toTarget} value={fmt(tm.targetDistanceKm, 2)} unit="km" />
              <div className={`fc-stat fc-stat--battery is-${batteryTone}`}>
                <span className="fc-stat__icon"><Ico name="battery" size={22} /></span>
                <div>
                  <span className="fc-stat__label">{c.battery}</span>
                  <strong>{battery === null ? '--' : `${battery.toFixed(1)}%`}</strong>
                  <span className="fc-battery"><i style={{ width: `${battery ?? 0}%` }} /></span>
                </div>
              </div>
              <Stat icon="mode" label={c.mode} value={tm.flightMode ?? '--'} />
            </div>
          </section>

          <section className="fc-panel">
            <header className="fc-panel__head">
              <span className="fc-panel__title is-bar">{c.control}</span>
            </header>
            <div className="fc-controls">
              {controls.map((item) => (
                <button
                  key={item.cmd}
                  type="button"
                  className={`fc-ctl${item.tone ? ` is-${item.tone}` : ''}`}
                  disabled={busy || !item.enabled}
                  onClick={() => onCommand(item.cmd)}
                >
                  <Ico name={item.icon} size={20} />
                  <strong>{item.label}</strong>
                  <small>{item.sub}</small>
                </button>
              ))}
              {onFinishFlight ? (
                <button
                  type="button"
                  className="fc-ctl is-success"
                  disabled={busy || finishingFlight}
                  onClick={onFinishFlight}
                >
                  <Ico name="land" size={20} />
                  <strong>{finishingFlight ? (language === 'en' ? 'Updating...' : 'Đang cập nhật...') : c.finishFlight}</strong>
                  <small>{c.finishFlightSub}</small>
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className={`fc-emergency${confirmStop ? ' is-armed' : ''}`}
              disabled={busy}
              onClick={() => {
                if (!confirmStop) { setConfirmStop(true); return }
                setConfirmStop(false)
                onCommand('emergency_stop')
              }}
            >
              <Ico name="stop" size={30} />
              <span>
                <strong>{c.emergency}</strong>
                <small>{confirmStop ? c.emergencyConfirm : c.emergencySub}</small>
              </span>
            </button>
          </section>
        </aside>
      </main>
      {overlay}
    </div>
  )
}
