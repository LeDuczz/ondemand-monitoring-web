import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { LivePage } from './LivePage'

describe('LivePage', () => {
  it('renders the Vietnamese title', () => {
    render(<LivePage orderId="ord-1" />)
    expect(screen.getByText('Giám sát realtime (CUS-06)')).toBeTruthy()
  })

  it('renders the English title when language is switched', () => {
    render(<LivePage orderId="ord-1" />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Realtime monitoring (CUS-06)')).toBeTruthy()
  })
})
