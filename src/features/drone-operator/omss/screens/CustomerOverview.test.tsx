import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import CustomerOverview from './CustomerOverview'

describe('CustomerOverview', () => {
  it('renders Vietnamese text by default', () => {
    render(<CustomerOverview />)
    expect(screen.getByText('Tổng quan khách hàng')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(<CustomerOverview />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Client overview')).toBeInTheDocument()
  })
})
