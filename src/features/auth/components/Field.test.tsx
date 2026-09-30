import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Field } from './Field'

describe('Field', () => {
  it('renders the label wired to the child input and the hint', () => {
    render(
      <Field label="Email" htmlFor="email" hint="bắt buộc">
        <input id="email" />
      </Field>,
    )
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByText('bắt buộc')).toBeInTheDocument()
  })

  it('shows the error message as an alert when error is set', () => {
    render(
      <Field label="Email" htmlFor="email" error="Email không hợp lệ">
        <input id="email" />
      </Field>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Email không hợp lệ')
  })

  it('does not render an alert when there is no error', () => {
    render(
      <Field label="Email" htmlFor="email">
        <input id="email" />
      </Field>,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
