import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import { env } from '../../../../config/env'
import {
  SIMULATION_MAP_DEFAULT_CROP,
  simulationMapAspectRatio,
  simulationMapImageStyle,
  worldToViewportPercent,
} from '../../../../shared/lib/simulationMapProjection'
import type { OrderDetail } from '../../types/orders'
import type { OrderReviewMessages } from '../../pages/OrderReviewPage.messages'
import { estimatedAreaHa } from './format'
import { OrderIcon } from './OrderIcon'

const SIMULATION_MAP_TOP_IMAGE = '/simulation-viewer/simulation_map_top.png'
const SIMULATION_MAP_VERSION = '20260925113000'
const SIMULATION_MAP_BOUNDS = {
  minX: -417.15933531249993,
  maxX: 415.15933531249993,
  minY: -414.65578218749977,
  maxY: 417.66288843749993,
}
const SIMULATION_MAP_IMAGE_CROP = SIMULATION_MAP_DEFAULT_CROP
const ZOOM_STEPS = [1, 1.5, 2, 3]

// The source image is square, so the visible (cropped) area has this aspect.
const MAP_ASPECT = (() => {
  const [w, h] = simulationMapAspectRatio(SIMULATION_MAP_IMAGE_CROP)
    .split('/')
    .map((n) => Number(n))
  return w / h
})()

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, size] as const
}

export function OrderLocationCard({
  order,
  t,
}: {
  order: OrderDetail
  t: OrderReviewMessages
}) {
  const [frameRef, size] = useElementSize<HTMLDivElement>()
  const [zoomIndex, setZoomIndex] = useState(0)

  const header = (action?: ReactNode) => (
    <header className="odm-or-card-head">
      <span className="odm-or-card-title">
        <OrderIcon name="pin" size={18} />
        {t.location}
      </span>
      {action}
    </header>
  )

  if (!order.center && !order.addressText) {
    return (
      <section className="odm-or-card">
        {header()}
        <div className="odm-or-card-body odm-or-empty">
          {t.noLocationData}
        </div>
      </section>
    )
  }

  const target = order.center
    ? worldToViewportPercent(
        { simX: order.center.lon, simY: order.center.lat },
        SIMULATION_MAP_BOUNDS,
        SIMULATION_MAP_IMAGE_CROP,
      )
    : { x: 50, y: 50 }
  const radiusUnits =
    order.radiusM == null
      ? null
      : Math.min(
          24,
          Math.max(
            4,
            (order.radiusM /
              (SIMULATION_MAP_BOUNDS.maxX - SIMULATION_MAP_BOUNDS.minX)) *
              100,
          ),
        )
  const areaHa = estimatedAreaHa(order.radiusM)
  const mapImageUrl = `${env.apiBaseUrl}${SIMULATION_MAP_TOP_IMAGE}?v=${SIMULATION_MAP_VERSION}`
  const imageStyle = simulationMapImageStyle(SIMULATION_MAP_IMAGE_CROP)

  // Keep the original projection untouched; just size/offset the projected
  // layer so it covers the (wide) frame and the target stays centered.
  const zoom = ZOOM_STEPS[zoomIndex]
  let layerStyle: CSSProperties = {
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  }
  if (size && size.w > 0 && size.h > 0) {
    const layerW = Math.max(size.w, size.h * MAP_ASPECT) * zoom
    const layerH = layerW / MAP_ASPECT
    layerStyle = {
      width: layerW,
      height: layerH,
      left: clamp(size.w / 2 - (target.x / 100) * layerW, size.w - layerW, 0),
      top: clamp(size.h / 2 - (target.y / 100) * layerH, size.h - layerH, 0),
    }
  }

  function toggleFullscreen() {
    const frame = frameRef.current
    if (!frame) return
    if (document.fullscreenElement) {
      void document.exitFullscreen?.()
    } else {
      void frame.requestFullscreen?.()
    }
  }

  const openButton = (
    <button
      type="button"
      className="odm-or-btn-outline"
      onClick={toggleFullscreen}
    >
      {t.openInMap}
      <OrderIcon name="external" size={14} />
    </button>
  )

  return (
    <section className="odm-or-card">
      {header(openButton)}
      <div className="odm-or-map" ref={frameRef}>
        <div className="odm-or-map-layer" style={layerStyle}>
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
            {radiusUnits != null && (
              <circle
                cx={target.x}
                cy={target.y}
                r={radiusUnits}
                className="odm-or-map-radius"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
          <span
            className="odm-or-map-pin"
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            aria-hidden="true"
          >
            <svg width="30" height="38" viewBox="0 0 30 38">
              <path
                d="M15 37C15 37 3 24.5 3 14.5a12 12 0 0 1 24 0C27 24.5 15 37 15 37z"
                fill="#1677ff"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle cx="15" cy="14.5" r="4.5" fill="#fff" />
            </svg>
          </span>
          {order.center ? (
            <span
              className="odm-or-map-badge"
              style={{ left: `${target.x}%`, top: `${target.y}%` }}
            >
              TARGET · X {order.center.lon.toFixed(1)} · Y{' '}
              {order.center.lat.toFixed(1)}
            </span>
          ) : null}
        </div>

        <div className="odm-or-map-controls">
          <button
            type="button"
            aria-label={t.mapZoomIn}
            disabled={zoomIndex >= ZOOM_STEPS.length - 1}
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
          >
            <OrderIcon name="plus" />
          </button>
          <button
            type="button"
            aria-label={t.mapZoomOut}
            disabled={zoomIndex <= 0}
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
          >
            <OrderIcon name="minus" />
          </button>
          <button
            type="button"
            aria-label={t.mapRecenter}
            onClick={() => setZoomIndex(0)}
          >
            <OrderIcon name="locate" />
          </button>
        </div>

        {order.radiusM != null ? (
          <div className="odm-or-map-overlay">
            <span className="odm-or-map-overlay-icon">
              <OrderIcon name="radius" size={18} />
            </span>
            <span>
              <span className="odm-or-map-overlay-line">
                {t.monitoringRadius}: <b>{order.radiusM} m</b>
              </span>
              {areaHa != null ? (
                <span className="odm-or-map-overlay-line is-muted">
                  {t.estimatedArea}: {areaHa} ha
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  )
}
