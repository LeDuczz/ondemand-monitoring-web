import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../../../shared/api/httpClient'
import { resetMockDb } from '../../../../../mocks/db'
import { mockFetch } from '../../../../../mocks'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { AccountDetailPage } from '../AccountDetailPage'

beforeEach(() => {
  resetMockDb()
  setHttpTransport(mockFetch)
})
afterEach(() => {
  resetMockDb()
  resetHttpTransport()
})

describe('AccountDetailPage', () => {
  it('renders the vietnamese section title', async () => {
    render(<AccountDetailPage accountId="mock-admin-truong" />)
    await waitFor(() =>
      expect(screen.getByText('Thông tin tài khoản')).toBeTruthy(),
    )
  })

  it('renders the english section title when language is switched', async () => {
    render(<AccountDetailPage accountId="mock-admin-truong" />)
    await waitFor(() =>
      expect(screen.getByText('Thông tin tài khoản')).toBeTruthy(),
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Account information')).toBeTruthy()
  })
})
