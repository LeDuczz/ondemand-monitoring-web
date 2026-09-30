import { act } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { RolePortalPage } from './RolePortalPage'

describe('RolePortalPage', () => {
  it('renders the Vietnamese content for a role', () => {
    render(<RolePortalPage role="CUSTOMER" />)
    expect(screen.getByText('Khu vực giám sát của bạn')).toBeInTheDocument()
    expect(
      screen.getByText('Đưa ra quyết định tiếp theo một cách tự tin.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Vừa cập nhật')).toBeInTheDocument()
  })

  it('renders the English content when language is switched', () => {
    render(<RolePortalPage role="CUSTOMER" />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Your monitoring workspace')).toBeInTheDocument()
    expect(
      screen.getByText('Make the next decision with confidence.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Updated just now')).toBeInTheDocument()
  })
})
