export type SimulationMapMetaLike = {
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

export type SimulationMapCrop = {
  left: number
  top: number
  right: number
  bottom: number
}

export const SIMULATION_MAP_DEFAULT_CROP: SimulationMapCrop = {
  left: 13.53,
  top: 23,
  right: 13.67,
  bottom: 1.9,
}

export function getSimulationMapBounds(meta: SimulationMapMetaLike) {
  return meta.imageBounds ?? meta
}

export function viewportPercentToImagePercent(
  point: { x: number; y: number },
  crop: SimulationMapCrop = SIMULATION_MAP_DEFAULT_CROP,
) {
  const visibleWidth = 100 - crop.left - crop.right
  const visibleHeight = 100 - crop.top - crop.bottom
  return {
    x: crop.left + (point.x / 100) * visibleWidth,
    y: crop.top + (point.y / 100) * visibleHeight,
  }
}

export function imagePercentToViewportPercent(
  point: { x: number; y: number },
  crop: SimulationMapCrop = SIMULATION_MAP_DEFAULT_CROP,
) {
  const visibleWidth = 100 - crop.left - crop.right
  const visibleHeight = 100 - crop.top - crop.bottom
  return {
    x: ((point.x - crop.left) / visibleWidth) * 100,
    y: ((point.y - crop.top) / visibleHeight) * 100,
  }
}

export function worldToImagePercent(
  point: { simX: number; simY: number },
  meta: SimulationMapMetaLike,
) {
  const bounds = getSimulationMapBounds(meta)
  return {
    x: ((point.simX - bounds.minX) / (bounds.maxX - bounds.minX)) * 100,
    y: ((bounds.maxY - point.simY) / (bounds.maxY - bounds.minY)) * 100,
  }
}

export function imagePercentToWorld(
  point: { x: number; y: number },
  meta: SimulationMapMetaLike,
) {
  const bounds = getSimulationMapBounds(meta)
  return {
    simX: bounds.minX + (point.x / 100) * (bounds.maxX - bounds.minX),
    simY: bounds.maxY - (point.y / 100) * (bounds.maxY - bounds.minY),
  }
}

export function worldToViewportPercent(
  point: { simX: number; simY: number },
  meta: SimulationMapMetaLike,
  crop: SimulationMapCrop = SIMULATION_MAP_DEFAULT_CROP,
) {
  return imagePercentToViewportPercent(worldToImagePercent(point, meta), crop)
}

export function viewportPercentToWorld(
  point: { x: number; y: number },
  meta: SimulationMapMetaLike,
  crop: SimulationMapCrop = SIMULATION_MAP_DEFAULT_CROP,
) {
  return imagePercentToWorld(viewportPercentToImagePercent(point, crop), meta)
}

export function simulationMapImageStyle(
  crop: SimulationMapCrop = SIMULATION_MAP_DEFAULT_CROP,
) {
  const visibleWidth = 100 - crop.left - crop.right
  const visibleHeight = 100 - crop.top - crop.bottom
  return {
    left: `${-(crop.left / visibleWidth) * 100}%`,
    top: `${-(crop.top / visibleHeight) * 100}%`,
    width: `${(100 / visibleWidth) * 100}%`,
    height: `${(100 / visibleHeight) * 100}%`,
  }
}

export function simulationMapAspectRatio(
  crop: SimulationMapCrop = SIMULATION_MAP_DEFAULT_CROP,
) {
  return `${100 - crop.left - crop.right} / ${100 - crop.top - crop.bottom}`
}
