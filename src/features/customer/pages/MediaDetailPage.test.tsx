import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { MediaDetailPage } from './MediaDetailPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('MediaDetailPage', () => {
  it('renders the Vietnamese file-info heading', async () => {
    render(<MediaDetailPage mediaId="med-001" />)
    expect(await screen.findByText('Thông tin file')).toBeTruthy()
  })

  it('renders the English file-info heading when language is switched', async () => {
    render(<MediaDetailPage mediaId="med-001" />)
    await screen.findByText('Thông tin file')
    act(() => setLanguage('en'))
    expect(await screen.findByText('File information')).toBeTruthy()
  })
})
