import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { resetMockDb } from '../../../mocks/db'
import { mockFetch } from '../../../mocks'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { CreateAccountPage } from './CreateAccountPage'

beforeEach(() => {
  resetMockDb()
  setHttpTransport(mockFetch)
})
afterEach(() => {
  resetMockDb()
  resetHttpTransport()
})

describe('CreateAccountPage', () => {
  it('renders the vietnamese title', () => {
    render(<CreateAccountPage />)
    expect(screen.getByText('Tạo tài khoản nhân viên')).toBeTruthy()
  })

  it('renders the english title when language is switched', () => {
    render(<CreateAccountPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Create employee account')).toBeTruthy()
  })
})
