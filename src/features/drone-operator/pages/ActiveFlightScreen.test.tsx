import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { ActiveFlightScreen } from './ActiveFlightScreen'

// Without a mission id (no route param, no active session), the screen
// stays on its "opening" shell synchronously.
describe('ActiveFlightScreen', () => {
  it('renders the vietnamese opening text', () => {
    render(<ActiveFlightScreen />)
    expect(screen.getByText('Đang mở buồng lái...')).toBeTruthy()
  })

  it('renders the english opening text when language is switched', () => {
    render(<ActiveFlightScreen />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Opening the cockpit...')).toBeTruthy()
  })
})
