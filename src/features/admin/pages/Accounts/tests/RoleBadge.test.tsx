import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { BE_USER_ROLES } from '../../../api/adminUsersApi'
import { RoleBadge } from '../../../components/common/RoleBadge'

describe('RoleBadge', () => {
  it('renders one distinct colour class per BE role with a label', () => {
    const classes = new Set<string>()
    for (const role of BE_USER_ROLES) {
      const { container, unmount } = render(<RoleBadge role={role} />)
      const el = container.firstElementChild as HTMLElement
      expect(el.className).toContain(`is-${role.toLowerCase()}`)
      classes.add(el.className)
      unmount()
    }
    expect(classes.size).toBe(BE_USER_ROLES.length)
  })

  it('shows the vietnamese label', () => {
    render(<RoleBadge role="ADMIN" />)
    expect(screen.getByText('Quản trị viên')).toBeTruthy()
  })
})
