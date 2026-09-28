import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../shared/i18n'
import { DroneOperatorApp } from './DroneOperatorApp'

afterEach(() => {
  window.location.hash = ''
})

// An unrecognized route falls back to the bilingual "not found" placeholder
// title (operatorActiveLabel returns '' for `notFound`).
describe('DroneOperatorApp', () => {
  it('renders the vietnamese not-found placeholder for an unknown route', () => {
    window.location.hash = '#portal/drone-operator/does-not-exist'
    render(<DroneOperatorApp />)
    expect(screen.getByText('Không tìm thấy')).toBeTruthy()
  })

  it('renders the english not-found placeholder when language is switched', () => {
    window.location.hash = '#portal/drone-operator/does-not-exist'
    render(<DroneOperatorApp />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Not found')).toBeTruthy()
  })
})
