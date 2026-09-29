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
import { AuditLogPage } from './AuditLogPage'

beforeEach(() => {
  resetMockDb()
  setHttpTransport(mockFetch)
})
afterEach(() => {
  resetMockDb()
  resetHttpTransport()
})

describe('AuditLogPage', () => {
  it('renders the vietnamese title', () => {
    render(<AuditLogPage />)
    expect(screen.getByText('Nhật ký hệ thống')).toBeTruthy()
  })

  it('renders the english title when language is switched', () => {
    render(<AuditLogPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Audit log')).toBeTruthy()
  })
})
