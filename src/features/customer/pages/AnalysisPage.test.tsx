import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { AnalysisPage } from './AnalysisPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('AnalysisPage', () => {
  it('renders the Vietnamese title', async () => {
    render(<AnalysisPage orderId="cus-ord-002" />)
    expect(await screen.findByText('Phân tích AI')).toBeTruthy()
  })

  it('renders the English title when language is switched', async () => {
    render(<AnalysisPage orderId="cus-ord-002" />)
    await screen.findByText('Phân tích AI')
    act(() => setLanguage('en'))
    expect(await screen.findByText('AI analysis')).toBeTruthy()
  })
})
