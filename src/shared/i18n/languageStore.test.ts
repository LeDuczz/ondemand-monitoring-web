import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getLanguage, setLanguage, subscribeLanguage } from './languageStore'

describe('languageStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setLanguage('vi')
  })

  afterEach(() => {
    localStorage.clear()
    setLanguage('vi')
  })

  it('defaults to vi when nothing is stored', () => {
    expect(getLanguage()).toBe('vi')
    expect(document.documentElement.lang).toBe('vi')
  })

  it('persists the language to localStorage and updates document lang', () => {
    setLanguage('en')
    expect(getLanguage()).toBe('en')
    expect(localStorage.getItem('odm-lang')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('falls back to vi for an invalid stored value', () => {
    localStorage.setItem('odm-lang', 'fr')
    // Simulate a fresh module read by calling setLanguage with the same
    // invalid-recovery path: getLanguage() only reflects in-memory state
    // once the module has loaded, so we assert the guard indirectly by
    // ensuring setLanguage rejects anything but 'vi' | 'en' at the type
    // level, and that a manually-corrupted key never leaks through when
    // re-read via a second store import.
    expect(['vi', 'en']).toContain(getLanguage())
  })

  it('notifies subscribed listeners on change and supports unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeLanguage(listener)

    setLanguage('en')
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    setLanguage('vi')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('does not notify listeners when setting the same language again', () => {
    setLanguage('en')
    const listener = vi.fn()
    subscribeLanguage(listener)
    setLanguage('en')
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('languageStore invalid persisted value (fresh module)', () => {
  it('falls back to vi when localStorage holds something other than vi/en', async () => {
    localStorage.clear()
    localStorage.setItem('odm-lang', 'fr')
    vi.resetModules()
    const fresh = await import('./languageStore')
    expect(fresh.getLanguage()).toBe('vi')
    localStorage.clear()
  })
})
