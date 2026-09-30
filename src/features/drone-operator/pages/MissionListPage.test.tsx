import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { MissionListPage } from './MissionListPage'

// No authenticated operator / mock server in this test: operatorApi.getProfile
// rejects immediately (no signed-in user), so the screen settles on its
// bilingual error state.
describe('MissionListPage', () => {
  it('renders the vietnamese error state', async () => {
    render(<MissionListPage searchQuery="" />)
    expect(
      await screen.findByText('Không tải được danh sách mission'),
    ).toBeTruthy()
    expect(screen.getByText('Thử lại')).toBeTruthy()
  })

  it('renders the english error state when language is switched', async () => {
    render(<MissionListPage searchQuery="" />)
    await screen.findByText('Không tải được danh sách mission')
    act(() => setLanguage('en'))
    expect(
      await screen.findByText('Could not load the mission list'),
    ).toBeTruthy()
    expect(screen.getByText('Retry')).toBeTruthy()
  })
})
