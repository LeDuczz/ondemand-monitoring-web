import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { LiveHubPage } from './LiveHubPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('LiveHubPage', () => {
  it('renders the Vietnamese title', async () => {
    render(<LiveHubPage />)
    expect(await screen.findByText('Xem trực tiếp')).toBeTruthy()
  })

  it('renders the English title when language is switched', async () => {
    render(<LiveHubPage />)
    await screen.findByText('Xem trực tiếp')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Live view')).toBeTruthy()
  })
})
