import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { AccountsPage } from './AccountsPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('AccountsPage', () => {
  it('renders the vietnamese title', () => {
    render(<AccountsPage />)
    expect(screen.getByText('Người dùng')).toBeTruthy()
  })

  it('renders the english title when language is switched', () => {
    render(<AccountsPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Users')).toBeTruthy()
  })
})
