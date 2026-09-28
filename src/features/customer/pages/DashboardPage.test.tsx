import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { DashboardPage } from './DashboardPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('DashboardPage', () => {
  it('renders the Vietnamese title', async () => {
    render(<DashboardPage />)
    expect(await screen.findByText('Tổng quan')).toBeTruthy()
  })

  it('renders the English title when language is switched', async () => {
    render(<DashboardPage />)
    await screen.findByText('Tổng quan')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Overview')).toBeTruthy()
  })
})
