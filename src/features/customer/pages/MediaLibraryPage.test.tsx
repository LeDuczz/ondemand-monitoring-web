import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { MediaLibraryPage } from './MediaLibraryPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('MediaLibraryPage', () => {
  it('renders the Vietnamese title', async () => {
    render(<MediaLibraryPage />)
    expect(await screen.findByText('Thư viện kết quả')).toBeTruthy()
  })

  it('renders the English title when language is switched', async () => {
    render(<MediaLibraryPage />)
    await screen.findByText('Thư viện kết quả')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Result library')).toBeTruthy()
  })
})
