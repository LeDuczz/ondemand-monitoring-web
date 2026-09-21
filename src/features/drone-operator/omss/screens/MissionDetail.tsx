import { useEffect, useState } from 'react'
import { env } from '../../../../config/env'
import type { Mission, Drone, Screen, MissionRoutePoint } from '../types'
import {
  MissionBadge,
  DroneBadge,
  PriorityBadge,
} from '../components/StatusBadge'

interface Props {
  mission: Mission
  drone: Drone
  onScreen: (s: Screen) => void
  onBack: () => void
  onStartFlight: () => void
}

function KV({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-2)', minWidth: 140 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text)',
          textAlign: 'right',
          fontFamily: mono ? 'var(--font-data)' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  )
}

const MAP_WIDTH = 400
const MAP_HEIGHT = 300
const MAP_PADDING = 42

type SimulationMapMeta = {
  image?: string
  imageVersion?: string
  minX: number
  maxX: number
  minY: number
  maxY: number
  imageBounds?: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

function useSimulationMapMeta() {
  const [meta, setMeta] = useState<SimulationMapMeta | null>(null)

  useEffect(() => {
    let alive = true

    async function loadMeta() {
      try {
        const response = await fetch(
          `${env.apiBaseUrl}/simulation-viewer/simulation-map.json`,
          { cache: 'no-store' },
        )
        if (!response.ok) return
        const payload = (await response.json()) as SimulationMapMeta
        if (alive) setMeta(payload)
      } catch {
        if (alive) setMeta(null)
      }
    }

    void loadMeta()

    return () => {
      alive = false
    }
  }, [])

  return meta
}

function formatPointValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function planBounds(points: MissionRoutePoint[]) {
  const xs = points.map((point) => point.simX)
  const ys = points.map((point) => point.simY)
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}

function mapPlanPoint(point: MissionRoutePoint, bounds: ReturnType<typeof planBounds>) {
  const spanX = Math.max(1, bounds.maxX - bounds.minX)
  const spanY = Math.max(1, bounds.maxY - bounds.minY)
  const drawableWidth = MAP_WIDTH - MAP_PADDING * 2
  const drawableHeight = MAP_HEIGHT - MAP_PADDING * 2
  const scale = Math.min(drawableWidth / spanX, drawableHeight / spanY)
  const routeWidth = spanX * scale
  const routeHeight = spanY * scale
  const offsetX = (MAP_WIDTH - routeWidth) / 2
  const offsetY = (MAP_HEIGHT - routeHeight) / 2

  return {
    x: offsetX + (point.simX - bounds.minX) * scale,
    y: offsetY + (bounds.maxY - point.simY) * scale,
  }
}

function mapSimulationPoint(point: MissionRoutePoint, meta: SimulationMapMeta) {
  const bounds = meta.imageBounds ?? meta
  const spanX = Math.max(1, bounds.maxX - bounds.minX)
  const spanY = Math.max(1, bounds.maxY - bounds.minY)

  return {
    x: ((point.simX - bounds.minX) / spanX) * MAP_WIDTH,
    y: MAP_HEIGHT - ((point.simY - bounds.minY) / spanY) * MAP_HEIGHT,
  }
}

function waypointLabel(point: MissionRoutePoint) {
  const reason = point.reason.replaceAll('_', ' ').toLowerCase()
  return `${point.sequence}. ${reason} | x ${formatPointValue(point.simX)}, y ${formatPointValue(point.simY)}, z ${formatPointValue(point.altitudeM)}m`
}

function MissionPlanMap({ mission }: { mission: Mission }) {
  const meta = useSimulationMapMeta()
  const routePoints = (mission.routePoints ?? [])
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
  const hasRoute = routePoints.length > 0
  const bounds = hasRoute && !meta ? planBounds(routePoints) : null
  const screenPoints =
    !hasRoute
      ? []
      : routePoints.map((point) => ({
          point,
          screen: meta
            ? mapSimulationPoint(point, meta)
            : mapPlanPoint(point, bounds as ReturnType<typeof planBounds>),
        }))
  const targetPoint =
    screenPoints.find(({ point }) => point.reason.toUpperCase() === 'TARGET') ??
    screenPoints[screenPoints.length - 1]
  const routePolyline = screenPoints
    .map(({ screen }) => `${screen.x.toFixed(2)},${screen.y.toFixed(2)}`)
    .join(' ')
  const mapImagePath = meta?.image ?? '/simulation-viewer/simulation_map_top.png'
  const mapImageVersion = meta?.imageVersion
    ? `?v=${encodeURIComponent(meta.imageVersion)}`
    : ''
  const mapImageUrl = `${env.apiBaseUrl}${mapImagePath}${mapImageVersion}`

  return (
    <svg
      width="100%"
      height="300"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      style={{ display: 'block' }}
    >
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#d7ded7" />
      <image
        href={mapImageUrl}
        x="0"
        y="0"
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        preserveAspectRatio="none"
      />
      <rect
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        fill="rgba(255,255,255,.08)"
      />

      {hasRoute ? (
        <>
          <polyline
            points={routePolyline}
            fill="none"
            stroke="rgba(6,182,212,.95)"
            strokeWidth="3"
            strokeDasharray="5,4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {screenPoints.map(({ point, screen }) => {
            const reason = point.reason.toUpperCase()
            const isStart = reason === 'START'
            const isTarget = reason === 'TARGET'
            return (
              <g key={point.id}>
                <title>{waypointLabel(point)}</title>
                <circle
                  cx={screen.x}
                  cy={screen.y}
                  r={isTarget ? 7 : 5}
                  fill={isStart ? '#10b981' : isTarget ? '#ef4444' : '#f59e0b'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={screen.x + 8}
                  y={screen.y - 8}
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="700"
                  paintOrder="stroke"
                  stroke="rgba(15,23,42,.85)"
                  strokeWidth="2"
                >
                  {point.sequence}
                </text>
              </g>
            )
          })}
          {targetPoint && (
            <>
              <circle
                cx={targetPoint.screen.x}
                cy={targetPoint.screen.y}
                r="16"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                opacity=".55"
              />
              <text
                x={targetPoint.screen.x}
                y={Math.max(18, targetPoint.screen.y - 22)}
                textAnchor="middle"
                fill="#fee2e2"
                fontSize="10"
                fontWeight="700"
                paintOrder="stroke"
                stroke="rgba(15,23,42,.9)"
                strokeWidth="2"
              >
                ORDER
              </text>
            </>
          )}
          <text
            x="14"
            y="278"
            fill="#f8fafc"
            fontSize="10"
            fontWeight="700"
            paintOrder="stroke"
            stroke="rgba(15,23,42,.9)"
            strokeWidth="2"
          >
            {routePoints.length} mission plan waypoints
          </text>
        </>
      ) : (
        <text
          x={MAP_WIDTH / 2}
          y={MAP_HEIGHT / 2}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="12"
          fontWeight="600"
        >
          No mission plan waypoints
        </text>
      )}

      <text
        x="370"
        y="26"
        fill="#f8fafc"
        fontSize="11"
        fontWeight="800"
        paintOrder="stroke"
        stroke="rgba(15,23,42,.9)"
        strokeWidth="2"
      >
        N
      </text>
      <line
        x1="374"
        y1="30"
        x2="374"
        y2="42"
        stroke="#f8fafc"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export default function MissionDetail({
  mission,
  drone,
  onScreen,
  onBack,
  onStartFlight,
}: Props) {
  const isAcceptable = mission.state === 'WAITING_OPERATOR_ACCEPTANCE'
  const hasPlan = (mission.routePoints?.length ?? 0) > 0
  const canStartFlight = hasPlan && mission.state !== 'COMPLETED' && mission.state !== 'CANCELLED'

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          color: 'var(--text-2)',
          fontSize: 13,
          cursor: 'pointer',
          padding: 0,
          marginBottom: 20,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M9 2L4 7l5 5" />
        </svg>
        My missions
      </button>

      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 6,
            }}
          >
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text)',
                margin: 0,
              }}
            >
              {mission.title}
            </h1>
            <PriorityBadge priority={mission.priority} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              style={{
                fontSize: 13,
                fontFamily: 'var(--font-data)',
                color: 'var(--text-3)',
              }}
            >
              {mission.id}
            </span>
            <MissionBadge state={mission.state} />
          </div>
        </div>
        {(isAcceptable || canStartFlight) && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {canStartFlight && (
              <button
                onClick={onStartFlight}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#16a34a',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Start flight
              </button>
            )}
            {isAcceptable && (
              <>
            <button
              onClick={() => onScreen('accept-reject')}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                border: '1px solid var(--border-2)',
                background: 'var(--surface)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              Reject
            </button>
            <button
              onClick={() => onScreen('accept-reject')}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent)',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Accept mission
            </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Three-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 280px',
          gap: 20,
        }}
      >
        {/* Mission details */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '20px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text)',
              margin: '0 0 4px',
            }}
          >
            Mission details
          </h2>
          <p
            style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}
          >
            Assignment and operational parameters
          </p>
          <KV label="Customer" value={mission.customer} />
          <KV label="Mission type" value="Infrastructure survey" />
          <KV label="Target location" value={mission.location} />
          <KV
            label="Scheduled"
            value={new Date(mission.scheduledAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          />
          <KV
            label="Duration estimate"
            value={`${mission.estimatedMinutes} min`}
          />
          <KV label="Max altitude" value={`${mission.maxAltitudeM} m AGL`} />
          <KV label="Distance" value={`${mission.distanceKm} km`} />
          <KV
            label="Flight plan"
            value={hasPlan ? `${mission.routePoints?.length ?? 0} waypoints ready` : 'No plan'}
          />
          {mission.notes && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                background: 'var(--surface-2)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--text-2)',
                lineHeight: 1.55,
              }}
            >
              {mission.notes}
            </div>
          )}
        </div>

        {/* Map */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text)',
                margin: '0 0 2px',
              }}
            >
              Location map
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
              {mission.location} · {mission.routePoints?.length ?? 0} waypoint
              {(mission.routePoints?.length ?? 0) === 1 ? '' : 's'}
            </p>
          </div>
          <MissionPlanMap mission={mission} />
        </div>

        {/* Drone */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '20px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text)',
              margin: '0 0 4px',
            }}
          >
            Assigned drone
          </h2>
          <p
            style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}
          >
            Current status and readiness
          </p>

          <div
            style={{
              background: 'var(--surface-2)',
              borderRadius: 8,
              padding: '14px',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            <svg
              width="64"
              height="48"
              viewBox="0 0 64 48"
              fill="none"
              style={{ display: 'block', margin: '0 auto 10px' }}
            >
              <rect
                x="26"
                y="20"
                width="12"
                height="8"
                rx="2"
                fill="#4f46e5"
                opacity=".15"
                stroke="#4f46e5"
                strokeWidth="1.2"
              />
              {[
                [8, 8],
                [48, 8],
                [8, 32],
                [48, 32],
              ].map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="5"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="1.2"
                  opacity=".5"
                />
              ))}
              {[
                [8, 8],
                [48, 8],
                [8, 32],
                [48, 32],
              ].map(([x, y], i) => (
                <line
                  key={i}
                  x1={x}
                  y1={y}
                  x2={[27, 37, 27, 37][i]}
                  y2={[22, 22, 26, 26][i]}
                  stroke="#6b7280"
                  strokeWidth="1"
                />
              ))}
              <circle cx="32" cy="24" r="3" fill="#4f46e5" />
            </svg>
            <div
              style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}
            >
              {drone.name}
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-data)',
                color: 'var(--text-3)',
                marginTop: 2,
              }}
            >
              {drone.id}
            </div>
            <div style={{ marginTop: 8 }}>
              <DroneBadge state={drone.state} />
            </div>
          </div>

          {[
            { label: 'Model', value: drone.model },
            { label: 'Serial', value: drone.serialNumber },
            { label: 'Battery', value: `${drone.battery}%` },
            { label: 'GPS', value: `${drone.gpsCount} satellites` },
            {
              label: 'Storage',
              value: `${(drone.storageMB / 1024).toFixed(1)} GB free`,
            },
          ].map((r) => (
            <div
              key={r.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {r.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text)',
                  fontFamily:
                    r.label === 'Serial' ? 'var(--font-data)' : undefined,
                }}
              >
                {r.value}
              </span>
            </div>
          ))}

          {/* Weather */}
          <div
            style={{
              marginTop: 16,
              padding: '12px',
              background: 'var(--green-bg)',
              border: '1px solid var(--green-border)',
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--green-text)',
                marginBottom: 4,
              }}
            >
              Weather — Good to fly
            </div>
            <div
              style={{ fontSize: 12, color: 'var(--green-text)', opacity: 0.8 }}
            >
              Wind 8 km/h · Visibility 14 km · Partly cloudy
            </div>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      {isAcceptable && (
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <button
            onClick={() => onScreen('accept-reject')}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--border-2)',
              background: 'var(--surface)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-2)',
              cursor: 'pointer',
            }}
          >
            Reject mission
          </button>
          <button
            onClick={() => onScreen('accept-reject')}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Accept mission
          </button>
        </div>
      )}
    </div>
  )
}
