import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { AiKnowledgePage } from '../AiKnowledgePage'
import { useMockTransport } from './helpers'

useMockTransport()

describe('AiKnowledgePage', () => {
  it('renders the vietnamese title with the sample-data badge', () => {
    render(<AiKnowledgePage />)
    expect(screen.getByText('Tri thức AI và luật kiểm tra')).toBeTruthy()
    expect(screen.getByText('Dữ liệu mẫu')).toBeTruthy()
  })

  it('renders the english title when language is switched', () => {
    render(<AiKnowledgePage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('AI knowledge & feasibility rules')).toBeTruthy()
    act(() => setLanguage('vi'))
  })

  it('translates the Code and Session column headers', async () => {
    render(<AiKnowledgePage />)
    fireEvent.click(screen.getByRole('tab', { name: /Luật khả thi/ }))
    expect(await screen.findByText('Mã')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: /Nhật ký phân tích/ }))
    expect(await screen.findByText('Phiên')).toBeTruthy()
    expect(screen.queryByText('Session')).toBeNull()
    act(() => setLanguage('en'))
    expect(screen.getByText('Session')).toBeTruthy()
    act(() => setLanguage('vi'))
  })

  it('reindexes a document and toggles a rule', async () => {
    render(<AiKnowledgePage />)
    const reindex = (await screen.findAllByLabelText(/^Index lại /))[0]
    fireEvent.click(reindex)
    await waitFor(() => expect(reindex).toHaveProperty('disabled', false))
    fireEvent.click(screen.getByRole('tab', { name: /Luật khả thi/ }))
    const toggle = (await screen.findAllByLabelText(/^(Tắt|Bật) /))[0]
    fireEvent.click(toggle)
    await waitFor(() => expect(toggle).toHaveProperty('disabled', false))
  })

  it('shows Save only after editing a rule weight', async () => {
    render(<AiKnowledgePage />)
    fireEvent.click(screen.getByRole('tab', { name: /Luật khả thi/ }))
    const weight = (await screen.findAllByLabelText(/^Trọng số /))[0] as HTMLInputElement
    expect(screen.queryByText('Lưu')).toBeNull()
    fireEvent.change(weight, { target: { value: '77' } })
    fireEvent.click(screen.getByText('Lưu'))
    await waitFor(() => expect(screen.queryByText('Lưu')).toBeNull())
  })

  it('shows an error state when the docs request fails', async () => {
    const { setHttpTransport } = await import('../../../../../shared/api/httpClient')
    setHttpTransport(async () => new Response('{}', { status: 500 }))
    render(<AiKnowledgePage />)
    await screen.findByText('Thử lại')
  })
})
