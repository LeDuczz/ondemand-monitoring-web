import { describe, expect, it } from 'vitest'

import { createDefaultForm } from './draftStorage'
import {
  AI_IMAGE_ANALYSIS_DESCRIPTION,
  buildCoverageArea,
  buildOrderPayload,
  calcArea,
  syncAiAddonDescription,
} from './payload'
import { truncateText } from './format'

describe('buildCoverageArea', () => {
  it('builds a closed 24-point ring around the centre', () => {
    const area = buildCoverageArea(106.7, 10.6, 300)
    const ring = area.coordinates[0]
    expect(area.type).toBe('Polygon')
    expect(ring).toHaveLength(25)
    expect(ring[0]).toEqual(ring[24])
    expect(Math.max(...ring.map((p) => p[0]))).toBeGreaterThan(106.7)
  })
})

describe('calcArea', () => {
  it('returns hectares with one decimal', () => {
    expect(calcArea(100)).toBe('3.1')
  })
})

describe('syncAiAddonDescription', () => {
  it('appends and removes the add-on sentence idempotently', () => {
    const added = syncAiAddonDescription('Mô tả', true)
    expect(added).toBe(`Mô tả\n${AI_IMAGE_ANALYSIS_DESCRIPTION}`)
    expect(syncAiAddonDescription(added, true)).toBe(added)
    expect(syncAiAddonDescription(added, false)).toBe('Mô tả')
  })
})

describe('truncateText', () => {
  it('truncates with an ellipsis', () => {
    expect(truncateText('abcdefghij', 6)).toBe('abc...')
    expect(truncateText('  abc ', 10)).toBe('abc')
  })
})

describe('buildOrderPayload', () => {
  const form = {
    ...createDefaultForm(),
    title: ' Giám sát ',
    address: ' KCN ',
    serviceId: 'svc-1',
    preferredTimeId: 'pt-1',
    deliverableTypeId: 'dt-1',
    attachments: [
      {
        id: 'att-1',
        fileName: 'site.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 123,
        dataUrl: 'data:image/jpeg;base64,abc',
      },
    ],
  }
  const score = { score: 90, level: 'good' as const, notes: [] }

  it('maps the form to the BE OrderCreateRequest shape', () => {
    const payload = buildOrderPayload({
      form,
      score,
      aiAnalysisRequested: false,
      pricingEstimate: null,
      consultationId: 'c-1',
    })
    expect(payload).toMatchObject({
      title: 'Giám sát',
      address: 'KCN',
      serviceId: 'svc-1',
      preferredTimeId: 'pt-1',
      description: undefined,
    })
    expect(payload.deliverables).toHaveLength(1)
    expect(payload.deliverables[0].deliverableTypeId).toBe('dt-1')
    expect(payload.deliverables[0].requirement).toMatchObject({
      consultationId: 'c-1',
      readinessScore: 90,
      customerAttachments: [
        {
          id: 'att-1',
          fileName: 'site.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 123,
          dataUrl: 'data:image/jpeg;base64,abc',
        },
      ],
      additionalRequirements: [],
    })
  })

  it('includes the AI add-on price when requested', () => {
    const payload = buildOrderPayload({
      form,
      score,
      aiAnalysisRequested: true,
      pricingEstimate: {
        serviceId: 'svc-1',
        servicePrice: 100,
        totalPrice: 150,
        additionalRequirements: [
          { type: 'AI_IMAGE_ANALYSIS', description: 'x', additionalPrice: 50 },
        ],
      },
    })
    const requirement = payload.deliverables[0].requirement as {
      additionalRequirements: Array<{ additionalPrice: number }>
    }
    expect(requirement.additionalRequirements[0].additionalPrice).toBe(50)
  })
})
