import { act } from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { SocialCallbackPage } from './SocialCallbackPage'

afterEach(() => {
  window.history.replaceState({}, '', '/')
})

describe('SocialCallbackPage', () => {
  it('renders the Vietnamese error state when no code is present', () => {
    window.history.replaceState({}, '', '/social/callback')
    render(<SocialCallbackPage />)
    expect(screen.getByText('Đăng nhập Google thất bại')).toBeInTheDocument()
    expect(screen.getByText('Quay lại đăng nhập')).toBeInTheDocument()
  })

  it('renders the English error state when language is switched', () => {
    window.history.replaceState({}, '', '/social/callback')
    render(<SocialCallbackPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Google sign-in failed')).toBeInTheDocument()
    expect(screen.getByText('Back to sign in')).toBeInTheDocument()
  })
})
