import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../shared/i18n'
import { OperatorSidebar } from './OperatorSidebar'

describe('OperatorSidebar', () => {
  it('renders vietnamese nav labels', () => {
    render(<OperatorSidebar route={{ screen: 'missions' }} />)
    expect(screen.getByText('Mission của tôi')).toBeTruthy()
    expect(screen.getByText('Bảo trì & Sự cố')).toBeTruthy()
  })

  it('renders english nav labels when language is switched', () => {
    render(<OperatorSidebar route={{ screen: 'missions' }} />)
    act(() => setLanguage('en'))
    expect(screen.getByText('My missions')).toBeTruthy()
    expect(screen.getByText('Maintenance & incidents')).toBeTruthy()
  })
})
