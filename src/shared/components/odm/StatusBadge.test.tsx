import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { setLanguage } from '../../i18n/languageStore'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  afterEach(() => {
    setLanguage('vi')
  })

  it('renders arbitrary children unchanged (existing usage)', () => {
    render(<StatusBadge tone="green">Đã duyệt</StatusBadge>)
    expect(screen.getByText('Đã duyệt')).toBeInTheDocument()
  })

  it('resolves the label itself from kind + status, in the current language', () => {
    render(<StatusBadge tone="green" kind="order" status="APPROVED" />)
    expect(screen.getByText('Đã duyệt')).toBeInTheDocument()
    cleanup()

    setLanguage('en')
    render(<StatusBadge tone="green" kind="order" status="APPROVED" />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })
})
