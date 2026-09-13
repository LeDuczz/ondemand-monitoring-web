import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { env } from '../../../../config/env';
import type { Drone, Mission } from '../types';

interface Props {
  mission: Mission;
  drone: Drone;
  onRTB: () => void;
  onEmergency: () => void;
}

type FlightCommand =
  | 'takeoff' | 'forward' | 'back' | 'left' | 'right' | 'up' | 'down'
  | 'yaw_left' | 'yaw_right' | 'stop' | 'land' | 'return_to_base'
  | 'emergency_stop' | 'camera_switch' | 'camera_monitor_toggle'
  | 'lidar_monitor_toggle' | 'telemetry_monitor_toggle' | 'photo'
  | 'video_toggle' | 'speed_up' | 'speed_down' | 'safety_toggle';

type IconName =
  | 'drone' | 'settings' | 'crosshair' | 'camera' | 'eye' | 'joystick'
  | 'map' | 'plus' | 'minus' | 'takeoff' | 'land' | 'alert'
  | 'arrowUp' | 'arrowDown' | 'arrowLeft' | 'arrowRight'
  | 'rotateLeft' | 'rotateRight' | 'gauge' | 'photo' | 'video'
  | 'radar' | 'activity' | 'shield';

type ControlStatus = {
  online?: boolean;
  positionReady?: boolean;
  positionGazebo?: { x: number; y: number };
  positionNed?: { northM: number; eastM: number; downM: number };
  yawDeg?: number;
  altitudeM?: number;
  speedMps?: number;
  batteryPercent?: number;
};

type MapMeta = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

const controlBaseUrl = import.meta.env.VITE_FLIGHT_CONTROL_API_URL ?? 'http://localhost:8090';

const flightControls: { command: FlightCommand; label: string; icon: IconName; tone?: 'danger' | 'amber' }[] = [
  { command: 'takeoff', label: 'Take off', icon: 'takeoff' },
  { command: 'land', label: 'Land', icon: 'land' },
  { command: 'emergency_stop', label: 'E-Stop', icon: 'alert', tone: 'danger' },
];

const movementControls: { command: FlightCommand; label: string; icon: IconName }[] = [
  { command: 'up', label: 'Up', icon: 'arrowUp' },
  { command: 'forward', label: 'Forward', icon: 'arrowUp' },
  { command: 'down', label: 'Down', icon: 'arrowDown' },
  { command: 'back', label: 'Back', icon: 'arrowDown' },
  { command: 'left', label: 'Left', icon: 'arrowLeft' },
  { command: 'right', label: 'Right', icon: 'arrowRight' },
];

const rotationControls: { command: FlightCommand; label: string; icon: IconName }[] = [
  { command: 'yaw_left', label: 'Yaw L', icon: 'rotateLeft' },
  { command: 'yaw_right', label: 'Yaw R', icon: 'rotateRight' },
  { command: 'speed_down', label: 'Speed -', icon: 'minus' },
  { command: 'speed_up', label: 'Speed +', icon: 'plus' },
];

const toolControls: { command: FlightCommand; label: string; icon: IconName }[] = [
  { command: 'camera_switch', label: 'Camera', icon: 'camera' },
  { command: 'photo', label: 'Photo', icon: 'photo' },
  { command: 'video_toggle', label: 'Video', icon: 'video' },
  { command: 'lidar_monitor_toggle', label: 'LiDAR', icon: 'radar' },
  { command: 'telemetry_monitor_toggle', label: 'Telemetry', icon: 'activity' },
  { command: 'safety_toggle', label: 'Safety', icon: 'shield' },
];

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {name === 'drone' && <><path {...common} d="M10 10h4v4h-4z" /><path {...common} d="M12 10V5M12 19v-5M10 12H5M19 12h-5" /><circle {...common} cx="5" cy="5" r="2" /><circle {...common} cx="19" cy="5" r="2" /><circle {...common} cx="5" cy="19" r="2" /><circle {...common} cx="19" cy="19" r="2" /></>}
      {name === 'settings' && <><circle {...common} cx="12" cy="12" r="3" /><path {...common} d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 5h-4l-.4 3a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 .1 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 3h4l.4-3a8 8 0 0 0 1.7-1l2.4 1 2-3.5z" /></>}
      {name === 'crosshair' && <><circle {...common} cx="12" cy="12" r="6" /><path {...common} d="M12 2v4M12 18v4M2 12h4M18 12h4" /></>}
      {name === 'camera' && <><path {...common} d="M5 7h3l1.5-2h5L16 7h3v12H5z" /><circle {...common} cx="12" cy="13" r="3" /></>}
      {name === 'eye' && <><path {...common} d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" /><circle {...common} cx="12" cy="12" r="2.5" /></>}
      {name === 'joystick' && <><circle {...common} cx="12" cy="7" r="3" /><path {...common} d="M12 10v5M7 20h10M9 15h6l2 5H7z" /></>}
      {name === 'map' && <><path {...common} d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2z" /><path {...common} d="M9 4v14M15 6v14" /></>}
      {name === 'plus' && <path {...common} d="M12 5v14M5 12h14" />}
      {name === 'minus' && <path {...common} d="M5 12h14" />}
      {name === 'takeoff' && <><path {...common} d="M12 19V5M7 10l5-5 5 5" /><path {...common} d="M5 19h14" /></>}
      {name === 'land' && <><path {...common} d="M12 5v14M7 14l5 5 5-5" /><path {...common} d="M5 19h14" /></>}
      {name === 'alert' && <><path {...common} d="M12 3 22 20H2z" /><path {...common} d="M12 9v5M12 17h.01" /></>}
      {name === 'arrowUp' && <path {...common} d="M12 19V5M6 11l6-6 6 6" />}
      {name === 'arrowDown' && <path {...common} d="M12 5v14M6 13l6 6 6-6" />}
      {name === 'arrowLeft' && <path {...common} d="M19 12H5M11 6l-6 6 6 6" />}
      {name === 'arrowRight' && <path {...common} d="M5 12h14M13 6l6 6-6 6" />}
      {name === 'rotateLeft' && <><path {...common} d="M4 7v6h6" /><path {...common} d="M5 13a7 7 0 1 0 2-7" /></>}
      {name === 'rotateRight' && <><path {...common} d="M20 7v6h-6" /><path {...common} d="M19 13a7 7 0 1 1-2-7" /></>}
      {name === 'gauge' && <><path {...common} d="M4 14a8 8 0 1 1 16 0" /><path {...common} d="m12 14 4-4" /><path {...common} d="M6 18h12" /></>}
      {name === 'photo' && <><rect {...common} x="4" y="5" width="16" height="14" rx="2" /><circle {...common} cx="9" cy="10" r="1.5" /><path {...common} d="m20 15-4-4-8 8" /></>}
      {name === 'video' && <><rect {...common} x="3" y="6" width="13" height="12" rx="2" /><path {...common} d="m16 10 5-3v10l-5-3z" /></>}
      {name === 'radar' && <><circle {...common} cx="12" cy="12" r="8" /><path {...common} d="M12 12 18 8M12 4v2M12 18v2M4 12h2M18 12h2" /></>}
      {name === 'activity' && <path {...common} d="M3 12h4l2-7 4 14 2-7h6" />}
      {name === 'shield' && <path {...common} d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />}
    </svg>
  );
}

function GlassPanel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(8, 13, 24, .66)',
        border: '1px solid rgba(148, 163, 184, .2)',
        boxShadow: '0 16px 40px rgba(0,0,0,.24)',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function useSimulationMap() {
  const [meta, setMeta] = useState<MapMeta | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadMap() {
      try {
        const metaRes = await fetch(`${env.apiBaseUrl}/simulation-viewer/simulation-map.json`, { cache: 'no-store' });
        const metaPayload = await metaRes.json();
        if (!alive) return;
        setMeta(metaPayload);
      } catch {
        if (!alive) return;
        setMeta(null);
      }
    }

    void loadMap();
    return () => {
      alive = false;
    };
  }, []);

  return { meta };
}

function RealMiniMap({ status }: { status: ControlStatus | null }) {
  const { meta } = useSimulationMap();
  const [zoom, setZoom] = useState(1);
  const [follow, setFollow] = useState(false);
  const width = 220;
  const height = 110;

  const worldToMinimap = (x: number, y: number) => {
    if (!meta) return [width / 2, height / 2] as const;
    const px = ((x - meta.minX) / (meta.maxX - meta.minX)) * width;
    const py = height - ((y - meta.minY) / (meta.maxY - meta.minY)) * height;
    return [px, py] as const;
  };

  const droneWorld = status?.positionGazebo ?? { x: 0, y: 0 };
  const [droneX, droneY] = worldToMinimap(droneWorld.x, droneWorld.y);
  const viewWidth = width / zoom;
  const viewHeight = height / zoom;
  const viewX = follow ? Math.max(0, Math.min(width - viewWidth, droneX - viewWidth / 2)) : (width - viewWidth) / 2;
  const viewY = follow ? Math.max(0, Math.min(height - viewHeight, droneY - viewHeight / 2)) : (height - viewHeight) / 2;
  const yaw = status?.yawDeg ?? 0;
  const mapImageUrl = `${env.apiBaseUrl}/simulation-viewer/simulation_map_top.png`;

  return (
    <GlassPanel style={{ position: 'absolute', right: 22, top: 22, width: 260, height: 178, overflow: 'hidden' }}>
      <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', borderBottom: '1px solid rgba(148,163,184,.16)', color: '#cbd5e1', fontSize: 11, fontWeight: 800 }}>
        <button onClick={() => setFollow((value) => !value)} style={{ display: 'flex', alignItems: 'center', gap: 7, border: 0, background: 'transparent', color: follow ? '#93c5fd' : '#cbd5e1', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
          <Icon name="map" size={14} /> Mini Map
        </button>
        <span style={{ display: 'flex', gap: 5 }}>
          <button onClick={() => setZoom((value) => Math.max(1, Number((value - .25).toFixed(2))))} style={{ border: 0, background: 'transparent', color: '#cbd5e1', cursor: 'pointer', display: 'grid', placeItems: 'center' }} title="Zoom out"><Icon name="minus" size={12} /></button>
          <button onClick={() => setZoom((value) => Math.min(3, Number((value + .25).toFixed(2))))} style={{ border: 0, background: 'transparent', color: '#cbd5e1', cursor: 'pointer', display: 'grid', placeItems: 'center' }} title="Zoom in"><Icon name="plus" size={12} /></button>
        </span>
      </div>
      <svg viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`} width="100%" height="150" preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" width={width} height={height} fill="rgba(15,23,42,.55)" />
        <image href={mapImageUrl} x="0" y="0" width={width} height={height} preserveAspectRatio="xMidYMid slice" opacity=".92" />
        <rect x="0" y="0" width={width} height={height} fill="rgba(2,6,23,.14)" />
        <g transform={`translate(${droneX} ${droneY}) rotate(${yaw})`}>
          <circle cx="0" cy="0" r="8" fill="rgba(96,165,250,.24)" stroke="rgba(191,219,254,.8)" strokeWidth="1" />
          <path d="M0 -9 L6 7 L0 4 L-6 7 Z" fill="#60a5fa" stroke="#eff6ff" strokeWidth="1" />
        </g>
        <text x={viewX + 8 / zoom} y={viewY + 13 / zoom} fill="#e5edf8" fontSize={9 / zoom} fontWeight="800">N</text>
        <path d={`M${viewX + 10 / zoom} ${viewY + 24 / zoom}v-8`} stroke="#e5edf8" strokeWidth={1.5 / zoom} strokeLinecap="round" />
      </svg>
    </GlassPanel>
  );
}

export default function InFlightControl({ mission, drone, onRTB, onEmergency }: Props) {
  const [elapsed, setElapsed] = useState(5);
  const [progress, setProgress] = useState(18.2);
  const [isOnline, setIsOnline] = useState(false);
  const [lastCommand, setLastCommand] = useState('Waiting for controller');
  const [busyCommand, setBusyCommand] = useState<FlightCommand | null>(null);
  const [streamRevision, setStreamRevision] = useState(0);
  const [controlStatus, setControlStatus] = useState<ControlStatus | null>(null);

  const streamUrl = useMemo(() => `${controlBaseUrl}/stream.mjpg?viewer=operator&v=${streamRevision}`, [streamRevision]);
  const remaining = Math.max(0, mission.estimatedMinutes * 60 - elapsed);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1);
      setProgress((value) => Math.min(100, value + 0.04));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let alive = true;

    async function checkStatus() {
      try {
        const response = await fetch(`${controlBaseUrl}/api/control/status`, { cache: 'no-store' });
        const status = await response.json().catch(() => ({ online: response.ok }));
        if (alive) {
          setControlStatus(status);
          setIsOnline((wasOnline) => {
            if (!wasOnline && response.ok) setStreamRevision((value) => value + 1);
            return response.ok;
          });
        }
      } catch {
        if (alive) setControlStatus(null);
        if (alive) setIsOnline(false);
      }
    }

    void checkStatus();
    const timer = window.setInterval(checkStatus, 2500);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  async function sendCommand(command: FlightCommand) {
    setBusyCommand(command);
    try {
      const response = await fetch(`${controlBaseUrl}/api/control/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setLastCommand(`${command.replaceAll('_', ' ')} sent`);
      setIsOnline(true);

      if (command === 'return_to_base') onRTB();
      if (command === 'emergency_stop') onEmergency();
    } catch {
      setLastCommand('Controller offline or command rejected');
      setIsOnline(false);
    } finally {
      setBusyCommand(null);
    }
  }

  const fmt = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const buttonStyle = (tone?: 'danger' | 'amber'): CSSProperties => ({
    width: 66,
    height: 58,
    borderRadius: 12,
    border: tone === 'danger' ? '1px solid rgba(248,113,113,.72)' : '1px solid rgba(148,163,184,.18)',
    background: tone === 'danger' ? 'rgba(127,29,29,.78)' : tone === 'amber' ? 'rgba(180,83,9,.76)' : 'rgba(15,23,42,.78)',
    color: tone === 'danger' ? '#fecaca' : '#e5edf8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    fontSize: 10,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
  });

  const controlButton = (item: { command: FlightCommand; label: string; icon: IconName; tone?: 'danger' | 'amber' }) => (
    <button
      key={`${item.command}-${item.label}`}
      onClick={() => void sendCommand(item.command)}
      disabled={busyCommand !== null}
      style={buttonStyle(item.tone)}
      title={item.label}
    >
      <Icon name={item.icon} size={18} />
      <span>{busyCommand === item.command ? 'Sending' : item.label}</span>
    </button>
  );

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateRows: '76px minmax(0,1fr) 42px', background: '#020617', color: '#e5edf8', overflow: 'hidden' }}>
      <header style={{ display: 'grid', gridTemplateColumns: '330px minmax(320px,1fr) 280px', alignItems: 'center', gap: 22, padding: '12px 22px', background: 'linear-gradient(180deg,#071324,#08111f)', borderBottom: '1px solid rgba(59,130,246,.28)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(37,99,235,.18)', border: '1px solid rgba(96,165,250,.3)', color: '#93c5fd' }}>
            <Icon name="drone" size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <strong style={{ fontSize: 14, letterSpacing: '.02em' }}>{drone.id}</strong>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 999, background: 'rgba(22,163,74,.18)', color: '#4ade80', fontSize: 10, fontWeight: 900 }}>
                <span className={isOnline ? 'pulse-dot' : undefined} style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? '#22c55e' : '#ef4444' }} />
                {isOnline ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: '#94a3b8' }}>Drone Operator</div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#64748b', letterSpacing: '.18em', textTransform: 'uppercase' }}>Mission Progress</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-data)', color: '#4ade80', fontWeight: 800 }}>{progress.toFixed(1)}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 999, background: 'rgba(30,41,59,.92)', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#16a34a,#22c55e)' }} />
          </div>
        </div>

        <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-data)', color: '#94a3b8' }}>{fmt(elapsed)} / {fmt(remaining)}</span>
          <button style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(148,163,184,.2)', background: 'rgba(15,23,42,.76)', color: '#cbd5e1', display: 'grid', placeItems: 'center', cursor: 'pointer' }} title="Settings">
            <Icon name="settings" size={18} />
          </button>
        </div>
      </header>

      <main style={{ position: 'relative', minHeight: 0, overflow: 'hidden' }}>
        <img
          src={streamUrl}
          alt="Live drone camera"
          onLoad={() => setIsOnline(true)}
          onError={() => setIsOnline(false)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center', display: 'block', background: '#020617' }}
        />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at center, transparent 0 42%, rgba(2,6,23,.08) 72%, rgba(2,6,23,.34) 100%)' }} />

        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 88, height: 88, transform: 'translate(-50%,-50%)', color: 'rgba(226,232,240,.68)', pointerEvents: 'none' }}>
          <Icon name="crosshair" size={88} />
        </div>

        <GlassPanel style={{ position: 'absolute', left: 22, top: 22, width: 176, padding: 14 }}>
          {[
            ['camera', 'Camera', 'FPV'],
            ['eye', 'View', 'First Person'],
            ['joystick', 'Mode', 'Manual'],
          ].map(([icon, label, value]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: label === 'Mode' ? 0 : 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 12 }}>
                <Icon name={icon as IconName} size={15} />
                {label}
              </span>
              <strong style={{ color: '#4ade80', fontSize: 12 }}>{value}</strong>
            </div>
          ))}
        </GlassPanel>

        <RealMiniMap status={controlStatus} />

        <GlassPanel style={{ position: 'absolute', right: 22, top: 214, width: 220, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#cbd5e1', marginBottom: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>Telemetry</div>
          {[
            ['Altitude', `${(controlStatus?.altitudeM ?? drone.altitude).toFixed(1)} m`],
            ['Speed', `${(controlStatus?.speedMps ?? drone.groundSpeed).toFixed(1)} m/s`],
            ['Battery', `${Math.round(controlStatus?.batteryPercent ?? drone.battery)}%`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{label}</span>
              <strong style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: '#e5edf8' }}>{value}</strong>
            </div>
          ))}
          <div style={{ height: 5, borderRadius: 999, background: 'rgba(30,41,59,.95)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.round(controlStatus?.batteryPercent ?? drone.battery)}%`, height: '100%', borderRadius: 999, background: '#22c55e' }} />
          </div>
        </GlassPanel>

        <GlassPanel style={{ position: 'absolute', right: 22, top: 370, padding: '7px 11px', color: '#cbd5e1', fontSize: 11 }}>
          {lastCommand}
        </GlassPanel>

        {!isOnline && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(2,6,23,.72)' }}>
            <GlassPanel style={{ padding: '18px 22px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#e5edf8', marginBottom: 7 }}>Live controller offline</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Start the flight controller terminal to show the camera stream.</div>
            </GlassPanel>
          </div>
        )}

        <GlassPanel style={{ position: 'absolute', left: '50%', bottom: 18, transform: 'translateX(-50%)', display: 'flex', alignItems: 'stretch', gap: 12, padding: 10, maxWidth: 'calc(100% - 44px)' }}>
          <div style={{ display: 'flex', gap: 7 }}>{flightControls.map(controlButton)}</div>
          <div style={{ width: 1, background: 'rgba(148,163,184,.18)' }} />
          <button onClick={() => void sendCommand('stop')} disabled={busyCommand !== null} style={{ ...buttonStyle(), background: 'rgba(20,83,45,.82)', color: '#86efac' }} title="Hover">
            <Icon name="joystick" size={18} />
            <span>Hover</span>
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 46px)', gridTemplateRows: 'repeat(2, 32px)', gap: 5, alignSelf: 'center' }}>
            {movementControls.map((item) => (
              <button key={item.label} onClick={() => void sendCommand(item.command)} disabled={busyCommand !== null} style={{ borderRadius: 8, border: '1px solid rgba(148,163,184,.18)', background: 'rgba(15,23,42,.78)', color: '#e5edf8', display: 'grid', placeItems: 'center', cursor: 'pointer' }} title={item.label}>
                <Icon name={item.icon} size={15} />
              </button>
            ))}
          </div>
          <div style={{ width: 1, background: 'rgba(148,163,184,.18)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 62px)', gap: 7 }}>{rotationControls.map(controlButton)}</div>
          <div style={{ width: 1, background: 'rgba(148,163,184,.18)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 58px)', gap: 7 }}>{toolControls.map(controlButton)}</div>
        </GlassPanel>
      </main>

      <footer style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 18px', background: '#071324', borderTop: '1px solid rgba(59,130,246,.24)' }}>
        {['Overview', 'Missions', 'Detail', 'GCS Connect'].map((label) => (
          <button key={label} style={{ height: 28, padding: '0 12px', borderRadius: 9, border: '1px solid transparent', background: label === 'GCS Connect' ? 'rgba(37,99,235,.2)' : 'transparent', color: label === 'GCS Connect' ? '#bfdbfe' : '#94a3b8', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#bbf7d0', fontSize: 12, fontWeight: 800 }}>
            <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
            All Systems Nominal
          </span>
          <span style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(37,99,235,.22)', border: '1px solid rgba(96,165,250,.28)', color: '#bfdbfe', fontSize: 11, fontWeight: 900 }}>
            In Flight
          </span>
        </div>
      </footer>
    </div>
  );
}
