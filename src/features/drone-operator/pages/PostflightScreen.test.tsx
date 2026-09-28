import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { PostflightScreen } from './PostflightScreen'

// useActiveMission's mission list comes from the real (unmocked) mission
// API, so it settles on no active mission and the screen shows its
// bilingual "mission not found" empty state.
describe('PostflightScreen', () => {
  it('renders the vietnamese empty state', async () => {
    render(<PostflightScreen />)
    expect(
      await screen.findByText('Không tìm thấy thông tin nhiệm vụ'),
    ).toBeTruthy()
  })

  it('renders the english empty state when language is switched', async () => {
    render(<PostflightScreen />)
    await screen.findByText('Không tìm thấy thông tin nhiệm vụ')
    act(() => setLanguage('en'))
    expect(
      await screen.findByText('Mission information not found'),
    ).toBeTruthy()
  })
})
