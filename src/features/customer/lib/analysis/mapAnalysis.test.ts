import { describe, expect, it } from 'vitest'

import { toAnalysisView } from './mapAnalysis'

describe('toAnalysisView', () => {
  it('returns null when the BE has no analysis yet', () => {
    expect(toAnalysisView(null)).toBeNull()
    expect(toAnalysisView(undefined)).toBeNull()
  })

  it('accepts overallVerdict and derives counts and ids', () => {
    const view = toAnalysisView({
      overallVerdict: 'RISKY',
      createdAt: '2026-09-14T00:00:00Z',
      llmSummary: 'Two warnings',
      findings: [
        { severity: 'INFO', message: 'ok', evidence: { T: '31 phút' } },
        { severity: 'WARNING', message: 'wind' },
        { severity: 'BLOCKER', message: 'nfz' },
      ],
    })
    expect(view?.verdict).toBe('RISKY')
    expect(view?.summary).toBe('Two warnings')
    expect(view?.analyzedAt).toBe('2026-09-14T00:00:00Z')
    expect(view?.findings.map((f) => f.severity)).toEqual(['BLOCKER', 'WARNING', 'INFO'])
    expect(view).toMatchObject({ blockerCount: 1, warningCount: 1, infoCount: 1 })
    expect(view?.findings[2].id).toBe('finding-1')
    expect(view?.findings[2].evidence).toEqual([{ key: 'T', value: '31 phút' }])
  })

  it('derives the verdict when missing and maps suggestion states', () => {
    const view = toAnalysisView({
      findings: [
        { id: 'a', severity: 'WARNING', message: 'x', suggestionLabel: 'Do it' },
        { id: 'b', severity: 'WARNING', message: 'y', suggestionLabel: 'Do', suggestionState: 'ACCEPTED' },
        { id: 'c', severity: 'INFO', message: 'z', customerAction: 'AUTO_FIXED' },
        { id: 'd', severity: 'INFO', message: 'w' },
      ],
    })
    expect(view?.verdict).toBe('RISKY')
    expect(view?.findings.map((f) => f.state)).toEqual(['PENDING', 'ACCEPTED', 'AUTO_FIXED', null])
  })

  it('treats an unknown severity as info', () => {
    const view = toAnalysisView({ findings: [{ severity: 'WEIRD', message: 'm' }] })
    expect(view?.findings[0].severity).toBe('INFO')
    expect(view?.verdict).toBe('FEASIBLE')
  })
})
