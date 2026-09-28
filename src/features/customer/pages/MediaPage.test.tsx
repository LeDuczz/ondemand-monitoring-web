import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { MediaPage } from './MediaPage'

describe('MediaPage', () => {
  it('renders the Vietnamese title', () => {
    render(<MediaPage orderId="ord-1" />)
    expect(screen.getByText('Thư viện media (CUS-07)')).toBeTruthy()
  })

  it('renders the English title when language is switched', () => {
    render(<MediaPage orderId="ord-1" />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Media library (CUS-07)')).toBeTruthy()
  })
})
