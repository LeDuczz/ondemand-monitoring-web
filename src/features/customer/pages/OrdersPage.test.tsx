import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { OrdersPage } from './OrdersPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('OrdersPage', () => {
  it('renders the Vietnamese page title', () => {
    render(<OrdersPage />)
    expect(screen.getByText('Đơn của tôi')).toBeTruthy()
  })

  it('renders the English page title when language is switched', () => {
    render(<OrdersPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('My orders')).toBeTruthy()
  })
})
