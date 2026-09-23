import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { exportCsv } from './exportCsv'

describe('exportCsv', () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>
  let removeChildSpy: ReturnType<typeof vi.spyOn>
  let clickSpy: ReturnType<typeof vi.spyOn>
  let createdAnchor: HTMLAnchorElement

  beforeEach(() => {
    createdAnchor = document.createElement('a')
    clickSpy = vi.spyOn(createdAnchor, 'click').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockReturnValue(
      createdAnchor as ReturnType<typeof document.createElement>,
    )
    appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockReturnValue(createdAnchor as Node)
    removeChildSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockReturnValue(createdAnchor as Node)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates an <a> element and calls .click()', () => {
    exportCsv(['Cột A', 'Cột B'], [['val1', 'val2']])
    expect(appendChildSpy).toHaveBeenCalledWith(createdAnchor)
    expect(clickSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalledWith(createdAnchor)
  })

  it('sets href to a data:text/csv URI', () => {
    exportCsv(['Header'], [['Row1']])
    expect(createdAnchor.href).toMatch(/^data:text\/csv/)
  })

  it('sets download filename with .csv extension', () => {
    exportCsv(['H'], [['R']], 'my-report')
    expect(createdAnchor.download).toBe('my-report.csv')
  })

  it('uses default filename "bao-cao" when none provided', () => {
    exportCsv(['H'], [['R']])
    expect(createdAnchor.download).toBe('bao-cao.csv')
  })

  it('escapes double-quotes in cells', () => {
    exportCsv(['A'], [['"quoted"']])
    const decoded = decodeURIComponent(
      createdAnchor.href.replace(/^data:text\/csv;charset=utf-8,/, ''),
    )
    expect(decoded).toContain('"""quoted"""')
  })
})
