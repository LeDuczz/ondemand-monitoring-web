import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { OrderDetailPage } from './OrderDetailPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('OrderDetailPage', () => {
  it('renders the Vietnamese order-info heading', async () => {
    render(<OrderDetailPage orderId="ord-2609-0157" />)
    expect(await screen.findByText('Thông tin đơn hàng')).toBeTruthy()
  })

  it('renders the English order-info heading when language is switched', async () => {
    render(<OrderDetailPage orderId="ord-2609-0157" />)
    await screen.findByText('Thông tin đơn hàng')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Order information')).toBeTruthy()
  })
})
