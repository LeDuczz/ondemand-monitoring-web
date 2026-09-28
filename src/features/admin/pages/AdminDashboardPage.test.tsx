import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { AdminDashboardPage } from './AdminDashboardPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('AdminDashboardPage', () => {
  it('renders the vietnamese title', async () => {
    render(<AdminDashboardPage />)
    await waitFor(() => expect(screen.getByText('Tổng quan hệ thống')).toBeTruthy())
  })

  it('renders the english title when language is switched', async () => {
    render(<AdminDashboardPage />)
    await waitFor(() => expect(screen.getByText('Tổng quan hệ thống')).toBeTruthy())
    act(() => setLanguage('en'))
    expect(screen.getByText('System overview')).toBeTruthy()
  })
})
