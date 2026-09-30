import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { CustomerChatbot } from './CustomerChatbot'

afterEach(() => setLanguage('vi'))

describe('CustomerChatbot', () => {
  it('renders the Vietnamese bubble text', () => {
    render(<CustomerChatbot />)
    expect(screen.getByText('Cần hỗ trợ?')).toBeTruthy()
  })

  it('renders the English bubble text when language is switched', () => {
    render(<CustomerChatbot />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Need help?')).toBeTruthy()
  })
})
