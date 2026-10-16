import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { useAdminUsersStub } from '../../Accounts/tests/helpers'
import { setLanguage } from '../../../../../shared/i18n'
import { AccountDetailPage } from '../AccountDetailPage'

useAdminUsersStub()

describe('AccountDetailPage', () => {
  it('renders the vietnamese section title', async () => {
    render(<AccountDetailPage accountId="mock-admin-truong" />)
    await waitFor(() =>
      expect(screen.getByText('Thông tin tài khoản')).toBeTruthy(),
    )
  })

  it('renders the english section title when language is switched', async () => {
    render(<AccountDetailPage accountId="mock-admin-truong" />)
    await waitFor(() =>
      expect(screen.getByText('Thông tin tài khoản')).toBeTruthy(),
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Account information')).toBeTruthy()
  })

  it('opens the shared user modal from the edit button', async () => {
    render(<AccountDetailPage accountId="mock-admin-truong" />)
    fireEvent.click(await screen.findByText('Chỉnh sửa'))
    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(
      (await screen.findAllByText('long.truong@odms.vn')).length,
    ).toBeGreaterThan(0)
  })
})
