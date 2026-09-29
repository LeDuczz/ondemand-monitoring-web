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
import { AiKnowledgePage } from './AiKnowledgePage'

beforeEach(() => {
  resetMockDb()
  setHttpTransport(mockFetch)
})
afterEach(() => {
  resetMockDb()
  resetHttpTransport()
})

describe('AiKnowledgePage', () => {
  it('renders the vietnamese title', () => {
    render(<AiKnowledgePage />)
    expect(screen.getByText('Tri thức AI và luật kiểm tra')).toBeTruthy()
  })

  it('renders the english title when language is switched', () => {
    render(<AiKnowledgePage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('AI knowledge & feasibility rules')).toBeTruthy()
  })
})
