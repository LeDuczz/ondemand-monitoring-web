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
import { CatalogPage } from './CatalogPage'

beforeEach(() => {
  resetMockDb()
  setHttpTransport(mockFetch)
})
afterEach(() => {
  resetMockDb()
  resetHttpTransport()
})

describe('CatalogPage', () => {
  it('renders the vietnamese title', () => {
    render(<CatalogPage />)
    expect(screen.getByText('Danh mục')).toBeTruthy()
  })

  it('renders the english title when language is switched', () => {
    render(<CatalogPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Catalog')).toBeTruthy()
  })
})
