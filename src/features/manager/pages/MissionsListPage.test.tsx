import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { MissionsListPage } from './MissionsListPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('MissionsListPage', () => {
  it('renders loading state', () => {
    const { container } = render(<MissionsListPage />)
    // The loading skeleton or aria-busy
    const busy = container.querySelector('[aria-busy="true"]')
    // Page title should be present
    expect(screen.getByText('Mission')).toBeTruthy()
    // Either loading indicator or data should be present
    expect(busy ?? container.querySelector('table')).toBeTruthy()
  })
})
