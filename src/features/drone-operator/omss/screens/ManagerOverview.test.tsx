import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import ManagerOverview from './ManagerOverview'

describe('ManagerOverview', () => {
  it('renders Vietnamese text by default', () => {
    render(<ManagerOverview />)
    expect(screen.getByText('Tổng quan vận hành')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(<ManagerOverview />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Operations overview')).toBeInTheDocument()
  })
})
