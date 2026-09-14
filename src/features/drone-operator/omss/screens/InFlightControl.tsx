import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { env } from '../../../../config/env';
import type { Drone, Mission } from '../types';
import RuntimePreflightCheck from './RuntimePreflightCheck';

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
  | 'moveForward' | 'moveBack' | 'moveLeft' | 'moveRight' | 'altitudeUp' | 'altitudeDown'
  | 'rotateLeft' | 'rotateRight' | 'gauge' | 'photo' | 'video'
  | 'radar' | 'activity' | 'shield' | 'chevronRight';

type ControlStatus = {
  online?: boolean;
  positionReady?: boolean;
  positionGazebo?: { x: number; y: number };
  positionNed?: { northM: number; eastM: number; downM: number };
  yawDeg?: number;
  altitudeM?: number;
  speedMps?: number;
  batteryPercent?: number;
  batteryState?: 'NORMAL' | 'LOW' | 'CRITICAL' | 'EMERGENCY';
  batteryDrainMode?: 'LANDED' | 'IDLE' | 'HOVER' | 'CRUISE' | 'ASCEND' | 'DESCEND';
  cameraMode?: 'FRONT' | 'DOWN';
};

type MapMeta = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type ZonePayload = {
  id?: string;
  code?: string;
  name?: string;
  zoneType?: string;
  restricted?: boolean;
  coordinates?: number[][];
};

type RestrictedZone = {
  id: string;
  code: string;
  name: string;
  coordinates: [number, number][];
};

type GeofenceLevel = 'UNKNOWN' | 'SAFE' | 'CAUTION' | 'DANGER' | 'VIOLATION';

type GeofenceStatus = {
  level: GeofenceLevel;
  zone?: RestrictedZone;
  distanceM?: number;
};

const controlBaseUrl = import.meta.env.VITE_FLIGHT_CONTROL_API_URL ?? 'http://localhost:8090';
const restrictedZoneTypes = new Set(['AIRPORT', 'RESTRICTED', 'NO_FLY', 'NO-FLY', 'NOFLY']);
const cautionDistanceM = 50;
const dangerDistanceM = 20;
const px4HomeSimX = Number(import.meta.env.VITE_GEOFENCE_PX4_HOME_SIM_X_M ?? 0);
const px4HomeSimY = Number(import.meta.env.VITE_GEOFENCE_PX4_HOME_SIM_Y_M ?? -280);

const flightControls: { command: FlightCommand; label: string; icon: IconName; tone?: 'danger' | 'amber' }[] = [
  { command: 'takeoff', label: 'Take off', icon: 'takeoff' },
  { command: 'land', label: 'Land', icon: 'land' },
  { command: 'emergency_stop', label: 'E-Stop', icon: 'alert', tone: 'danger' },
];

const movementControls: { command: FlightCommand; label: string; icon: IconName }[] = [
  { command: 'up', label: 'Ascend', icon: 'altitudeUp' },
  { command: 'forward', label: 'Forward', icon: 'moveForward' },
  { command: 'down', label: 'Descend', icon: 'altitudeDown' },
  { command: 'left', label: 'Left', icon: 'moveLeft' },
  { command: 'back', label: 'Back', icon: 'moveBack' },
  { command: 'right', label: 'Right', icon: 'moveRight' },
];

const rotationControls: { command: FlightCommand; label: string; icon: IconName }[] = [
  { command: 'yaw_left', label: 'Yaw L', icon: 'rotateLeft' },
  { command: 'yaw_right', label: 'Yaw R', icon: 'rotateRight' },
  { command: 'speed_down', label: 'Speed -', icon: 'minus' },
  { command: 'speed_up', label: 'Speed +', icon: 'plus' },
];

const moreToolControls: { command: FlightCommand; label: string; icon: IconName }[] = [
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
      {name === 'moveForward' && <><path {...common} d="M12 19V6" /><path {...common} d="m7 11 5-5 5 5" /><path {...common} d="M6 21h12" /></>}
      {name === 'moveBack' && <><path {...common} d="M12 5v13" /><path {...common} d="m7 13 5 5 5-5" /><path {...common} d="M6 3h12" /></>}
      {name === 'moveLeft' && <><path {...common} d="M19 12H6" /><path {...common} d="m11 7-5 5 5 5" /><path {...common} d="M21 6v12" /></>}
      {name === 'moveRight' && <><path {...common} d="M5 12h13" /><path {...common} d="m13 7 5 5-5 5" /><path {...common} d="M3 6v12" /></>}
      {name === 'altitudeUp' && <><path {...common} d="M12 20V7" /><path {...common} d="m8 11 4-4 4 4" /><path {...common} d="M7 20h10" /><path {...common} d="M18 5h3M19.5 3.5v3" /></>}
      {name === 'altitudeDown' && <><path {...common} d="M12 4v13" /><path {...common} d="m8 13 4 4 4-4" /><path {...common} d="M7 20h10" /><path {...common} d="M18 5h3" /></>}
      {name === 'rotateLeft' && <><path {...common} d="M4 7v6h6" /><path {...common} d="M5 13a7 7 0 1 0 2-7" /></>}
      {name === 'rotateRight' && <><path {...common} d="M20 7v6h-6" /><path {...common} d="M19 13a7 7 0 1 1-2-7" /></>}
      {name === 'gauge' && <><path {...common} d="M4 14a8 8 0 1 1 16 0" /><path {...common} d="m12 14 4-4" /><path {...common} d="M6 18h12" /></>}
      {name === 'photo' && <><rect {...common} x="4" y="5" width="16" height="14" rx="2" /><circle {...common} cx="9" cy="10" r="1.5" /><path {...common} d="m20 15-4-4-8 8" /></>}
      {name === 'video' && <><rect {...common} x="3" y="6" width="13" height="12" rx="2" /><path {...common} d="m16 10 5-3v10l-5-3z" /></>}
      {name === 'radar' && <><circle {...common} cx="12" cy="12" r="8" /><path {...common} d="M12 12 18 8M12 4v2M12 18v2M4 12h2M18 12h2" /></>}
      {name === 'activity' && <path {...common} d="M3 12h4l2-7 4 14 2-7h6" />}
      {name === 'shield' && <path {...common} d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />}
      {name === 'chevronRight' && <path {...common} d="m9 6 6 6-6 6" />}
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

function normalizeRing(coordinates: number[][] | undefined): [number, number][] {
  if (!coordinates) return [];
  const ring = coordinates
    .map((point) => [Number(point[0]), Number(point[1])] as [number, number])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

  if (ring.length < 3) return [];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
  return ring;
}

function pointOnSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
  if (Math.abs(cross) > 1e-9) return false;
  return (px - ax) * (px - bx) + (py - ay) * (py - by) <= 1e-9;
}

function polygonContainsPoint(ring: [number, number][], point: [number, number]) {
  const [px, py] = point;
  let inside = false;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [ax, ay] = ring[index];
    const [bx, by] = ring[index + 1];
    if (pointOnSegment(px, py, ax, ay, bx, by)) return true;
    if ((ay > py) !== (by > py)) {
      const xAtY = ax + ((py - ay) * (bx - ax)) / (by - ay);
      if (px < xAtY) inside = !inside;
    }
  }
  return inside;
}

function pointSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq <= 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function pointPolygonDistance(ring: [number, number][], point: [number, number]) {
  const [px, py] = point;
  if (polygonContainsPoint(ring, point)) return 0;
  return Math.min(...ring.slice(0, -1).map(([ax, ay], index) => {
    const [bx, by] = ring[index + 1];
    return pointSegmentDistance(px, py, ax, ay, bx, by);
  }));
}

function useRestrictedZones() {
  const [zones, setZones] = useState<RestrictedZone[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadZones() {
      try {
        const response = await fetch(`${env.apiBaseUrl}/api/zones`, { cache: 'no-store' });
        const payload = await response.json();
        const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
        const restricted = (items as ZonePayload[])
          .filter((zone) => zone.restricted || restrictedZoneTypes.has(String(zone.zoneType ?? '').toUpperCase()))
          .map((zone) => ({
            id: String(zone.id ?? zone.code ?? zone.name ?? 'restricted-zone'),
            code: String(zone.code ?? ''),
            name: String(zone.name ?? zone.code ?? 'Restricted zone'),
            coordinates: normalizeRing(zone.coordinates),
          }))
          .filter((zone) => zone.coordinates.length >= 4);
        if (alive) setZones(restricted);
      } catch {
        if (alive) setZones([]);
      }
    }

    void loadZones();
    const timer = window.setInterval(loadZones, 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  return zones;
}

function evaluateGeofence(point: [number, number] | null, zones: RestrictedZone[]): GeofenceStatus {
  if (!point) return { level: 'UNKNOWN' };

  let nearestZone: RestrictedZone | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const zone of zones) {
    if (polygonContainsPoint(zone.coordinates, point)) {
      return { level: 'VIOLATION', zone, distanceM: 0 };
    }
    const distance = pointPolygonDistance(zone.coordinates, point);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestZone = zone;
    }
  }

  if (!nearestZone) return { level: 'SAFE' };
  if (nearestDistance <= dangerDistanceM) return { level: 'DANGER', zone: nearestZone, distanceM: nearestDistance };
  if (nearestDistance <= cautionDistanceM) return { level: 'CAUTION', zone: nearestZone, distanceM: nearestDistance };
  return { level: 'SAFE', zone: nearestZone, distanceM: nearestDistance };
}

function statusToSimulationPoint(status: ControlStatus | null): [number, number] | null {
  if (status?.positionNed) {
    return [px4HomeSimX + status.positionNed.eastM, px4HomeSimY + status.positionNed.northM];
  }
  if (status?.positionGazebo) {
    return [status.positionGazebo.x, status.positionGazebo.y];
  }
  return null;
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

  const simPoint = statusToSimulationPoint(status);
  const droneWorld = simPoint ? { x: simPoint[0], y: simPoint[1] } : { x: 0, y: 0 };
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [preflightReady, setPreflightReady] = useState(false);
  const restrictedZones = useRestrictedZones();

  const streamUrl = useMemo(() => `${controlBaseUrl}/stream.mjpg?viewer=operator&v=${streamRevision}`, [streamRevision]);
  const remaining = Math.max(0, mission.estimatedMinutes * 60 - elapsed);
  const dronePoint = statusToSimulationPoint(controlStatus);
  const geofenceStatus = useMemo(() => evaluateGeofence(dronePoint, restrictedZones), [dronePoint, restrictedZones]);
  const geofenceAlertActive = geofenceStatus.level === 'CAUTION' || geofenceStatus.level === 'DANGER' || geofenceStatus.level === 'VIOLATION';
  const geofenceTone = geofenceStatus.level === 'VIOLATION' || geofenceStatus.level === 'DANGER' ? 'danger' : 'amber';
  const geofenceZoneName = geofenceStatus.zone?.name ?? geofenceStatus.zone?.code ?? 'restricted zone';
  const geofenceMessage =
    geofenceStatus.level === 'VIOLATION'
      ? `Restricted zone breach: ${geofenceZoneName}`
      : geofenceStatus.level === 'DANGER'
        ? `Restricted zone danger: ${Math.round(geofenceStatus.distanceM ?? 0)} m from ${geofenceZoneName}`
        : geofenceStatus.level === 'CAUTION'
          ? `Restricted zone caution: ${Math.round(geofenceStatus.distanceM ?? 0)} m from ${geofenceZoneName}`
          : 'All Systems Nominal';
  const footerStatusColor = geofenceAlertActive
    ? geofenceTone === 'danger' ? '#fecaca' : '#fde68a'
    : '#bbf7d0';
  const footerStatusDot = geofenceAlertActive
    ? geofenceTone === 'danger' ? '#ef4444' : '#f59e0b'
    : '#22c55e';

  useEffect(() => {
    window.sessionStorage.removeItem('omss.droneOperator.preflightReady');
  }, []);

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
    if (!preflightReady) {
      setLastCommand('Preflight required');
      return;
    }
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
  const telemetryValue = (value: number | undefined, suffix: string, digits = 1) =>
    typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(digits)} ${suffix}` : '--';
  const telemetryBattery = typeof controlStatus?.batteryPercent === 'number' && Number.isFinite(controlStatus.batteryPercent)
    ? Math.max(0, Math.min(100, controlStatus.batteryPercent))
    : null;
  const batteryDisplay = telemetryBattery === null ? '--' : `${telemetryBattery.toFixed(1)}%`;
  const batteryState = controlStatus?.batteryState ?? 'NORMAL';
  const batteryMode = controlStatus?.batteryDrainMode ?? 'LANDED';
  const batteryTone =
    batteryState === 'EMERGENCY' ? '#ef4444' :
    batteryState === 'CRITICAL' ? '#f87171' :
    batteryState === 'LOW' ? '#fbbf24' :
    '#22c55e';
  const showBatteryWarning = telemetryBattery !== null && batteryState !== 'NORMAL';
  const cameraMode = controlStatus?.cameraMode === 'DOWN' ? 'DOWN' : 'FRONT';
  const cameraLabel = cameraMode === 'DOWN' ? 'Downward' : 'FPV';
  const viewLabel = cameraMode === 'DOWN' ? 'Top Down' : 'First Person';

  const buttonStyle = (tone?: 'danger' | 'amber'): CSSProperties => ({
    width: 48,
    height: 40,
    borderRadius: 8,
    border: tone === 'danger' ? '1px solid rgba(248,113,113,.72)' : '1px solid rgba(148,163,184,.18)',
    background: tone === 'danger' ? 'rgba(127,29,29,.78)' : tone === 'amber' ? 'rgba(180,83,9,.76)' : 'rgba(15,23,42,.78)',
    color: tone === 'danger' ? '#fecaca' : '#e5edf8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    fontSize: 8,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
  });

  const toolbarGroupStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 3,
    borderRadius: 10,
    background: 'rgba(15, 23, 42, .42)',
    border: '1px solid rgba(148,163,184,.12)',
  };

  const controlButton = (item: { command: FlightCommand; label: string; icon: IconName; tone?: 'danger' | 'amber' }) => (
    <button
      key={`${item.command}-${item.label}`}
      onClick={() => void sendCommand(item.command)}
      disabled={busyCommand !== null}
      style={buttonStyle(item.tone)}
      title={item.label}
    >
      <Icon name={item.icon} size={14} />
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
            ['camera', 'Camera', cameraLabel],
            ['eye', 'View', viewLabel],
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
            ['Altitude', telemetryValue(controlStatus?.altitudeM, 'm')],
            ['Speed', telemetryValue(controlStatus?.speedMps, 'm/s')],
            ['Battery', batteryDisplay],
            ['Drain', batteryMode],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{label}</span>
              <strong style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: '#e5edf8' }}>{value}</strong>
            </div>
          ))}
          <div style={{ height: 5, borderRadius: 999, background: 'rgba(30,41,59,.95)', overflow: 'hidden' }}>
            <div style={{ width: `${telemetryBattery ?? 0}%`, height: '100%', borderRadius: 999, background: batteryTone, transition: 'width .35s ease, background .2s ease' }} />
          </div>
        </GlassPanel>

        {showBatteryWarning && (
          <GlassPanel style={{ position: 'absolute', left: '50%', top: geofenceAlertActive ? 100 : 28, transform: 'translateX(-50%)', width: 'min(360px, calc(100% - 56px))', padding: '11px 14px', border: `1px solid ${batteryState === 'LOW' ? 'rgba(251,191,36,.7)' : 'rgba(248,113,113,.72)'}`, background: batteryState === 'LOW' ? 'rgba(120,53,15,.82)' : 'rgba(127,29,29,.78)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="alert" size={20} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 950, color: batteryState === 'LOW' ? '#fef3c7' : '#fee2e2', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  {batteryState === 'LOW' ? 'Low battery' : batteryState === 'CRITICAL' ? 'Critical battery' : 'Emergency battery'} - {batteryDisplay}
                </div>
                <div style={{ marginTop: 3, fontSize: 11, color: batteryState === 'LOW' ? '#fde68a' : '#fecaca', fontWeight: 750 }}>
                  Manual control remains available. No automatic flight action was triggered.
                </div>
              </div>
            </div>
          </GlassPanel>
        )}

        <GlassPanel style={{ position: 'absolute', right: 22, top: 370, padding: '7px 11px', color: '#cbd5e1', fontSize: 11 }}>
          {lastCommand}
        </GlassPanel>

        {geofenceAlertActive && (
          <GlassPanel style={{ position: 'absolute', left: '50%', top: 28, transform: 'translateX(-50%)', width: 'min(460px, calc(100% - 56px))', padding: '13px 16px', border: geofenceTone === 'danger' ? '1px solid rgba(248,113,113,.72)' : '1px solid rgba(251,191,36,.72)', background: geofenceTone === 'danger' ? 'rgba(127,29,29,.78)' : 'rgba(120,53,15,.82)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="alert" size={22} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 950, color: geofenceTone === 'danger' ? '#fee2e2' : '#fef3c7', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  {geofenceStatus.level === 'VIOLATION' ? 'No-fly zone breach' : 'No-fly zone warning'}
                </div>
                <div style={{ marginTop: 3, fontSize: 12, color: geofenceTone === 'danger' ? '#fecaca' : '#fde68a', fontWeight: 750 }}>
                  {geofenceMessage}
                </div>
              </div>
            </div>
          </GlassPanel>
        )}

        {!isOnline && preflightReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(2,6,23,.72)' }}>
            <GlassPanel style={{ padding: '18px 22px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#e5edf8', marginBottom: 7 }}>Live controller offline</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Start the flight controller terminal to show the camera stream.</div>
            </GlassPanel>
          </div>
        )}

        {!preflightReady && (
          <div style={{ position: 'absolute', inset: '0 0 6px', zIndex: 20, background: 'rgba(2,6,23,.72)', backdropFilter: 'blur(3px)', overflow: 'auto' }}>
            <RuntimePreflightCheck
              onReady={() => {
                setPreflightReady(true);
                setLastCommand('Preflight completed');
              }}
            />
          </div>
        )}

        <GlassPanel style={{ position: 'absolute', left: '50%', bottom: 8, transform: 'translateX(-50%)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 5, width: 'min(780px, calc(100% - 24px))', maxWidth: 'calc(100% - 24px)', maxHeight: 'min(118px, 18vh)', overflow: 'visible' }}>
          <div style={{ ...toolbarGroupStyle, maxWidth: 210 }}>
            {flightControls.map(controlButton)}
            <button onClick={() => void sendCommand('stop')} disabled={busyCommand !== null} style={{ ...buttonStyle(), background: 'rgba(20,83,45,.82)', color: '#86efac' }} title="Hover">
              <Icon name="joystick" size={14} />
              <span>Hover</span>
            </button>
          </div>

          <div style={{ ...toolbarGroupStyle, display: 'grid', gridTemplateColumns: 'repeat(3, 48px)', gap: 3 }}>
            {movementControls.map((item) => (
              <button
                key={item.label}
                onClick={() => void sendCommand(item.command)}
                disabled={busyCommand !== null}
                style={{
                  width: 48,
                  height: 31,
                  borderRadius: 8,
                  border: '1px solid rgba(148,163,184,.18)',
                  background: 'rgba(15,23,42,.78)',
                  color: '#e5edf8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  fontSize: 7,
                  fontWeight: 850,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)',
                }}
                title={item.label}
              >
                <Icon name={item.icon} size={12} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div style={{ ...toolbarGroupStyle, maxWidth: 210 }}>{rotationControls.map(controlButton)}</div>
          <div style={{ ...toolbarGroupStyle, maxWidth: 62, flexWrap: 'nowrap', position: 'relative' }}>
            <button
              onClick={() => setMoreOpen((value) => !value)}
              disabled={busyCommand !== null}
              style={buttonStyle()}
              title="More controls"
            >
              <Icon name="chevronRight" size={14} />
              <span>More</span>
            </button>
            {moreOpen && (
              <GlassPanel style={{ position: 'absolute', right: 0, bottom: 50, display: 'grid', gridTemplateColumns: 'repeat(3, 48px)', gap: 5, padding: 6, zIndex: 10 }}>
                {moreToolControls.map(controlButton)}
              </GlassPanel>
            )}
          </div>
        </GlassPanel>
      </main>

      <footer style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 18px', background: '#071324', borderTop: '1px solid rgba(59,130,246,.24)' }}>
        {['Overview', 'Missions', 'Detail', 'GCS Connect'].map((label) => (
          <button key={label} style={{ height: 28, padding: '0 12px', borderRadius: 9, border: '1px solid transparent', background: label === 'GCS Connect' ? 'rgba(37,99,235,.2)' : 'transparent', color: label === 'GCS Connect' ? '#bfdbfe' : '#94a3b8', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: footerStatusColor, fontSize: 12, fontWeight: 800 }}>
            <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: footerStatusDot }} />
            {geofenceMessage}
          </span>
          <span style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(37,99,235,.22)', border: '1px solid rgba(96,165,250,.28)', color: '#bfdbfe', fontSize: 11, fontWeight: 900 }}>
            In Flight
          </span>
        </div>
      </footer>
    </div>
  );
}
