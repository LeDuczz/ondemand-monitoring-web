import { useEffect, useRef } from 'react'

/**
 * Subtle pointer-follow parallax. Tracks pointermove over the returned
 * element ref and writes the offset (normalized, clamped to [-1, 1]) into
 * `--parallax-x` / `--parallax-y` CSS custom properties on that element,
 * rAF-throttled so we never write faster than the browser can paint.
 *
 * Disabled entirely (vars stay at 0) on touch-primary devices and when the
 * user has `prefers-reduced-motion: reduce` set.
 */
export function useParallax<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const isTouch = window.matchMedia('(pointer: coarse)').matches

    if (reducedMotion || isTouch) {
      return undefined
    }

    let frame: number | null = null
    let pendingX = 0
    let pendingY = 0

    const apply = () => {
      frame = null
      node.style.setProperty('--parallax-x', pendingX.toFixed(3))
      node.style.setProperty('--parallax-y', pendingY.toFixed(3))
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      pendingX = Math.min(1, Math.max(-1, x * 2 - 1))
      pendingY = Math.min(1, Math.max(-1, y * 2 - 1))

      if (frame === null) {
        frame = requestAnimationFrame(apply)
      }
    }

    const onPointerLeave = () => {
      pendingX = 0
      pendingY = 0
      if (frame === null) {
        frame = requestAnimationFrame(apply)
      }
    }

    node.addEventListener('pointermove', onPointerMove)
    node.addEventListener('pointerleave', onPointerLeave)

    return () => {
      node.removeEventListener('pointermove', onPointerMove)
      node.removeEventListener('pointerleave', onPointerLeave)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [])

  return ref
}
