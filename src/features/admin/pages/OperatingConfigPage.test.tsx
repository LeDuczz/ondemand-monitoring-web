import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { OperatingConfigPage } from './OperatingConfigPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('OperatingConfigPage', () => {
  it('renders the vietnamese title', () => {
    render(<OperatingConfigPage />)
    expect(screen.getByText('Cấu hình vận hành')).toBeTruthy()
  })

  it('renders the english title when language is switched', () => {
    render(<OperatingConfigPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Operating configuration')).toBeTruthy()
  })
})
