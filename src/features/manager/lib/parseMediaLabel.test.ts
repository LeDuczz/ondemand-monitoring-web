import { describe, expect, it } from 'vitest'

import { parseMediaLabel, parseMediaLabels } from './parseMediaLabel'

describe('parseMediaLabel', () => {
  it('parses "VIDEO × 1 · 240 giây" (ORD-2609-0153)', () => {
    expect(parseMediaLabel('VIDEO × 1 · 240 giây')).toEqual({
      mediaType: 'VIDEO',
      durationSec: 240,
    })
  })

  it('parses "PHOTO × 30 · 640×512" (ORD-2609-0153)', () => {
    expect(parseMediaLabel('PHOTO × 30 · 640×512')).toEqual({
      mediaType: 'PHOTO',
      quantity: 30,
    })
  })

  it('parses "VIDEO × 2 · 300 giây · 1080p" (ORD-2609-0157) as total seconds', () => {
    expect(parseMediaLabel('VIDEO × 2 · 300 giây · 1080p')).toEqual({
      mediaType: 'VIDEO',
      durationSec: 600,
    })
  })

  it('parses "LIVESTREAM · 900 giây · 1080p" (ORD-2609-0157)', () => {
    expect(parseMediaLabel('LIVESTREAM · 900 giây · 1080p')).toEqual({
      mediaType: 'LIVESTREAM',
      durationSec: 900,
    })
  })

  it('returns null for an unrecognized label', () => {
    expect(parseMediaLabel('Bản đồ 2D/3D')).toBeNull()
  })
})

describe('parseMediaLabels', () => {
  it('drops unrecognized labels and keeps parsed ones', () => {
    const result = parseMediaLabels([
      'VIDEO × 1 · 240 giây',
      'Bản đồ 2D/3D',
      'PHOTO × 30 · 640×512',
    ])
    expect(result).toHaveLength(2)
  })
})
