import { describe, expect, it } from 'vitest'

import { rolesSubtitle } from './rolesSubtitle'

describe('rolesSubtitle', () => {
  it('counts total roles and system-locked roles', () => {
    const roles = [
      { isSystemRole: true },
      { isSystemRole: true },
      { isSystemRole: false },
    ]
    expect(rolesSubtitle(roles)).toBe('3 vai trò · 2 vai trò hệ thống bị khoá sửa và xoá')
  })

  it('handles zero system roles', () => {
    expect(rolesSubtitle([{ isSystemRole: false }])).toBe(
      '1 vai trò · 0 vai trò hệ thống bị khoá sửa và xoá',
    )
  })

  it('handles empty list', () => {
    expect(rolesSubtitle([])).toBe('0 vai trò · 0 vai trò hệ thống bị khoá sửa và xoá')
  })
})
