import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import SysOpOverview from './SysOpOverview'

describe('SysOpOverview', () => {
  it('renders Vietnamese text by default', () => {
    render(<SysOpOverview />)
    expect(screen.getByText('Tổng quan hệ thống')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(<SysOpOverview />)
    act(() => setLanguage('en'))
    expect(screen.getByText('System overview')).toBeInTheDocument()
  })
})
