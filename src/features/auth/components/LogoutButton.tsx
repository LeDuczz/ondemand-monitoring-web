import { useState } from 'react'

import { Icon } from '../../../shared/components/Icon'
import { logout } from '../api/logout'

/**
 * Reusable "Đăng xuất" (sign out) button. Wraps `.odm` on itself so the
 * `.odm-btn` tokens resolve correctly even when the surrounding layout
 * (e.g. the current English-language PortalLayout) isn't itself scoped
 * under `.odm`. Meant to be reused by the Manager sidebar in a later phase.
 */
export function LogoutButton({ className = '' }: { className?: string }) {
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    setPending(true)
    try {
      await logout()
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      className={`odm odm-btn odm-btn-gh ${className}`.trim()}
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending}
    >
      <Icon name="arrow-left" />
      <span>{pending ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
    </button>
  )
}
