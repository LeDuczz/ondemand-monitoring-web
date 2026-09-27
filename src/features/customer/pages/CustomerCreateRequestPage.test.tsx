import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { CustomerCreateRequestPage } from './CustomerCreateRequestPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('CustomerCreateRequestPage', () => {
  it('renders the Vietnamese page title', async () => {
    render(<CustomerCreateRequestPage />)
    expect(await screen.findByText('Tạo yêu cầu giám sát')).toBeTruthy()
  })

  it('renders the English page title when language is switched', async () => {
    render(<CustomerCreateRequestPage />)
    await screen.findByText('Tạo yêu cầu giám sát')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Create Monitoring Request')).toBeTruthy()
  })
})
