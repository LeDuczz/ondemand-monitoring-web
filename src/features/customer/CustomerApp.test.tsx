import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { customerMediaApi } from './api/customerMediaApi'

import { resetMockDb } from '../../mocks/db'
import '../../mocks/index'
import { setLanguage } from '../../shared/i18n'
import { CustomerApp } from './CustomerApp'

beforeEach(() => {
  resetMockDb()
  window.location.hash = '#portal/customer'
})
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

describe('CustomerApp', () => {
  it('renders the Vietnamese dashboard breadcrumb', async () => {
    render(<CustomerApp />)
    expect((await screen.findAllByText('Tổng quan')).length).toBeGreaterThan(0)
  })

  it('renders the English dashboard breadcrumb when language is switched', async () => {
    render(<CustomerApp />)
    await screen.findAllByText('Tổng quan')
    act(() => setLanguage('en'))
    expect((await screen.findAllByText('Overview')).length).toBeGreaterThan(0)
  })

  it('derives the sidebar new-media badge from the BE media notifications', async () => {
    const spy = vi.spyOn(customerMediaApi, 'listNotifications')
    render(<CustomerApp />)
    await waitFor(() => expect(spy).toHaveBeenCalled())
    await waitFor(() => expect(document.querySelector('.odm-cus-navc')?.textContent).toBe('3'))
  })
})
