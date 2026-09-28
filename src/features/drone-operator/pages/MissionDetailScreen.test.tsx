import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { MissionDetailScreen } from './MissionDetailScreen'

// operatorApi.getMission routes through the real (unmocked) mission API, so
// it rejects in this test environment and the screen settles on its
// bilingual "mission not found" error state.
describe('MissionDetailScreen', () => {
  it('renders the vietnamese error state', async () => {
    render(<MissionDetailScreen missionId="MSN-1" />)
    expect(await screen.findByText('Không tải được mission')).toBeTruthy()
    expect(screen.getByText('Về danh sách')).toBeTruthy()
  })

  it('renders the english error state when language is switched', async () => {
    render(<MissionDetailScreen missionId="MSN-1" />)
    await screen.findByText('Không tải được mission')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Could not load the mission')).toBeTruthy()
    expect(screen.getByText('Back to list')).toBeTruthy()
  })
})
