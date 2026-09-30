import { afterEach, describe, expect, it } from 'vitest'

import {
  CREATE_ORDER_DRAFT_STORAGE_KEY,
  clearStoredDraft,
  isStep,
  readStoredDraft,
  writeStoredDraft,
} from './draftStorage'

afterEach(() => window.localStorage.clear())

describe('draft storage', () => {
  it('round-trips a draft and clears it', () => {
    writeStoredDraft({ step: 3 })
    expect(readStoredDraft()).toEqual({ step: 3 })
    clearStoredDraft()
    expect(readStoredDraft()).toBeNull()
  })

  it('returns null for corrupt JSON', () => {
    window.localStorage.setItem(CREATE_ORDER_DRAFT_STORAGE_KEY, '{oops')
    expect(readStoredDraft()).toBeNull()
  })

  it('validates step values', () => {
    expect(isStep(2)).toBe(true)
    expect(isStep(5)).toBe(false)
    expect(isStep('1')).toBe(false)
  })
})
