import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useParallax } from './useParallax'

function mockMatchMedia(matches: Partial<Record<string, boolean>>) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: matches[query] ?? false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

// Real requestAnimationFrame always defers to the next frame; stub it the
// same way (via a macrotask) so the hook's "one frame in flight" guard
// behaves like it does in a browser instead of resolving synchronously.
function stubRaf() {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    return setTimeout(() => cb(0), 0) as unknown as number
  })
}

function flushRaf() {
  return act(() => new Promise((resolve) => setTimeout(resolve, 0)))
}

function TestTarget() {
  const ref = useParallax<HTMLDivElement>()
  return (
    <div ref={ref} data-testid="target" style={{ width: 100, height: 100 }} />
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useParallax', () => {
  it('writes --parallax-x/--parallax-y on pointermove when motion is allowed', async () => {
    mockMatchMedia({
      '(prefers-reduced-motion: reduce)': false,
      '(pointer: coarse)': false,
    })
    stubRaf()

    const { getByTestId } = render(<TestTarget />)
    const node = getByTestId('target')
    vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    act(() => {
      node.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 75, clientY: 25 }),
      )
    })
    await flushRaf()

    expect(node.style.getPropertyValue('--parallax-x')).toBe('0.500')
    expect(node.style.getPropertyValue('--parallax-y')).toBe('-0.500')
  })

  it('resets offset to 0 on pointerleave', async () => {
    mockMatchMedia({
      '(prefers-reduced-motion: reduce)': false,
      '(pointer: coarse)': false,
    })
    stubRaf()

    const { getByTestId } = render(<TestTarget />)
    const node = getByTestId('target')
    vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    act(() => {
      node.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 90, clientY: 90 }),
      )
    })
    await flushRaf()

    act(() => {
      node.dispatchEvent(new PointerEvent('pointerleave'))
    })
    await flushRaf()

    expect(node.style.getPropertyValue('--parallax-x')).toBe('0.000')
    expect(node.style.getPropertyValue('--parallax-y')).toBe('0.000')
  })

  it('does not bind listeners when reduced motion is preferred', () => {
    mockMatchMedia({
      '(prefers-reduced-motion: reduce)': true,
      '(pointer: coarse)': false,
    })

    const { getByTestId } = render(<TestTarget />)
    const node = getByTestId('target')

    act(() => {
      node.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 75, clientY: 25 }),
      )
    })

    expect(node.style.getPropertyValue('--parallax-x')).toBe('')
  })

  it('does not bind listeners on touch-primary devices', () => {
    mockMatchMedia({
      '(prefers-reduced-motion: reduce)': false,
      '(pointer: coarse)': true,
    })

    const { getByTestId } = render(<TestTarget />)
    const node = getByTestId('target')

    act(() => {
      node.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 75, clientY: 25 }),
      )
    })

    expect(node.style.getPropertyValue('--parallax-x')).toBe('')
  })
})
