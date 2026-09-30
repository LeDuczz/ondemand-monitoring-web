import { describe, expect, it } from 'vitest'

import {
  buildConsultationRequestContext,
  buildInitialConsultationMessage,
  consultationStatusKey,
  isReusableConsultation,
  parseAiAnalysisAnswer,
} from './consultation'
import { createDefaultForm } from './draftStorage'
import { scoreRequest } from './scoring'

describe('isReusableConsultation', () => {
  it('rejects local, ordered, confirmed, cancelled and empty sessions', () => {
    expect(isReusableConsultation(null)).toBe(false)
    expect(isReusableConsultation({ id: 'local-1' })).toBe(false)
    expect(isReusableConsultation({ id: 'c', orderId: 'o' })).toBe(false)
    expect(isReusableConsultation({ id: 'c', status: 'CONFIRMED' })).toBe(false)
    expect(isReusableConsultation({ id: 'c', status: 'CANCELLED' })).toBe(false)
    expect(isReusableConsultation({ id: 'c', status: 'ACTIVE' })).toBe(true)
  })
})

describe('parseAiAnalysisAnswer', () => {
  it('understands Vietnamese and English yes/no', () => {
    expect(parseAiAnalysisAnswer('Có, cần')).toBe(true)
    expect(parseAiAnalysisAnswer('Được')).toBe(true)
    expect(parseAiAnalysisAnswer('Không cần')).toBe(false)
    expect(parseAiAnalysisAnswer('no')).toBe(false)
    expect(parseAiAnalysisAnswer('có lẽ sau')).toBe(true)
    expect(parseAiAnalysisAnswer('xin chào')).toBeUndefined()
  })
})

describe('consultationStatusKey', () => {
  it('maps known, unknown and missing statuses', () => {
    expect(consultationStatusKey('RECOMMENDED')).toBe('RECOMMENDED')
    expect(consultationStatusKey('WEIRD')).toBe('UPDATING')
    expect(consultationStatusKey(undefined)).toBe('NOT_STARTED')
  })
})

describe('buildConsultationRequestContext', () => {
  it('embeds the form values and latest message', () => {
    const text = buildConsultationRequestContext({
      form: { ...createDefaultForm(), address: 'KCN' },
      mapPoint: { x: 10, y: 20 },
      serviceName: 'Mái nhà',
      latestMessage: 'hello',
    })
    expect(text).toContain('KCN')
    expect(text).toContain('x=10.0%')
    expect(text).toContain('hello')
    expect(text).toContain('Mái nhà')
  })
})

describe('buildInitialConsultationMessage', () => {
  it('keeps the visible chat message customer-friendly', () => {
    const text = buildInitialConsultationMessage({
      form: {
        ...createDefaultForm(),
        address: 'Công trường xây dựng',
        latitude: '10.1',
        longitude: '106.2',
      },
      mapPoint: { x: 76.6, y: 55.7 },
    })
    expect(text).toBe(
      'Tôi muốn được tư vấn dịch vụ giám sát phù hợp cho khu vực Công trường xây dựng.',
    )
    expect(text).not.toContain('Step 1')
    expect(text).not.toContain('latitude')
    expect(text).not.toContain('map x=')
  })
})

describe('scoreRequest', () => {
  const notes = {
    missingAddress: 'a',
    missingService: 's',
    missingDeliverable: 'd',
    missingSchedule: 'sc',
    largeRadius: 'r',
    allGood: 'ok',
  }

  it('penalises missing fields and grades the level', () => {
    const result = scoreRequest(createDefaultForm(), notes)
    expect(result.score).toBe(92 - 18 - 20 - 14 - 18)
    expect(result.level).toBe('bad')
    expect(result.notes).toEqual(['a', 's', 'd', 'sc'])
  })

  it('is good with a complete form', () => {
    const result = scoreRequest(
      { ...createDefaultForm(), address: 'A', serviceId: 's', deliverableTypeId: 'd', preferredTimeId: 't' },
      notes,
    )
    expect(result).toMatchObject({ score: 92, level: 'good', notes: ['ok'] })
  })
})
