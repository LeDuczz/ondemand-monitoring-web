import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import AdminOverview from './AdminOverview'

describe('AdminOverview', () => {
  it('renders Vietnamese text by default', () => {
    render(<AdminOverview />)
    expect(screen.getByText('Quản trị')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(<AdminOverview />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Administration')).toBeInTheDocument()
  })
})
