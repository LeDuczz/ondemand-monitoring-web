import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import { CustomerMediaGallery } from './CustomerMediaGallery'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('CustomerMediaGallery', () => {
  it('renders the Vietnamese title', () => {
    render(<CustomerMediaGallery />)
    expect(screen.getByText('Media lần bay')).toBeTruthy()
  })

  it('renders the English title when language is switched', () => {
    render(<CustomerMediaGallery />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Mission media')).toBeTruthy()
  })
})
