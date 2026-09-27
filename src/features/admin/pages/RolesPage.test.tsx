import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { RolesPage } from './RolesPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('RolesPage', () => {
  it('renders the vietnamese title', () => {
    render(<RolesPage />)
    expect(screen.getByText('Vai trò')).toBeTruthy()
  })

  it('renders the english title when language is switched', () => {
    render(<RolesPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Roles')).toBeTruthy()
  })
})
