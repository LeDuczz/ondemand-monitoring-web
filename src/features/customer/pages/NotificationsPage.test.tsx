import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { NotificationsPage } from './NotificationsPage'

describe('NotificationsPage', () => {
  it('renders the Vietnamese title', () => {
    render(<NotificationsPage />)
    expect(screen.getByText('Thông báo')).toBeTruthy()
  })

  it('renders the English title when language is switched', () => {
    render(<NotificationsPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Notifications')).toBeTruthy()
  })
})
