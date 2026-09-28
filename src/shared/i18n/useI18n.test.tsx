import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { defineMessages } from './defineMessages'
import { setLanguage } from './languageStore'
import { useI18n } from './useI18n'

const messages = defineMessages({
  vi: { title: 'Xin chào', count: (n: number) => `${n} nhiệm vụ` },
  en: { title: 'Hello', count: (n: number) => `${n} missions` },
})

function Demo() {
  const { t, lang, locale } = useI18n(messages)
  return (
    <div>
      <h1>{t.title}</h1>
      <p>{t.count(3)}</p>
      <span data-testid="lang">{lang}</span>
      <span data-testid="locale">{locale}</span>
    </div>
  )
}

describe('useI18n', () => {
  afterEach(() => {
    setLanguage('vi')
  })

  it('renders the vi messages by default', () => {
    render(<Demo />)
    expect(screen.getByText('Xin chào')).toBeInTheDocument()
    expect(screen.getByText('3 nhiệm vụ')).toBeInTheDocument()
    expect(screen.getByTestId('lang')).toHaveTextContent('vi')
    expect(screen.getByTestId('locale')).toHaveTextContent('vi-VN')
  })

  it('re-renders with English messages after setLanguage("en")', () => {
    render(<Demo />)
    act(() => {
      setLanguage('en')
    })
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('3 missions')).toBeInTheDocument()
    expect(screen.getByTestId('lang')).toHaveTextContent('en')
    expect(screen.getByTestId('locale')).toHaveTextContent('en-US')
  })
})
