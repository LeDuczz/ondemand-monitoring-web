import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { supportApi } from '../../../api/supportApi'
import { HelpCenterHomePage } from '../HelpCenterHomePage'

beforeEach(() => {
  vi.spyOn(supportApi, 'getFaqArticles').mockResolvedValue([])
  vi.spyOn(supportApi, 'recordFaqFeedback').mockResolvedValue(undefined)
  localStorage.clear()
})
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})

describe('HelpCenterHomePage', () => {
  it('renders the Vietnamese title and the topic cards', async () => {
    render(<HelpCenterHomePage />)
    expect(await screen.findByText('Chúng tôi có thể hỗ trợ bạn như thế nào?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nhiệm vụ bay/, pressed: false })).toBeInTheDocument()
  })

  it('switches title, topics and FAQ to English', async () => {
    render(<HelpCenterHomePage />)
    await screen.findByText('Chúng tôi có thể hỗ trợ bạn như thế nào?')
    act(() => setLanguage('en'))
    expect(await screen.findByText('How can we help you?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Flight missions/, pressed: false })).toBeInTheDocument()
    expect(screen.getByText('Why is my monitoring request still pending approval?')).toBeInTheDocument()
  })

  it('filters by topic and clears the filter', async () => {
    render(<HelpCenterHomePage />)
    fireEvent.click(await screen.findByRole('button', { name: /Nhiệm vụ bay/, pressed: false }))
    expect(screen.getByText('Câu hỏi thường gặp (Nhiệm vụ bay)')).toBeInTheDocument()
    expect(screen.queryByText(/Tại sao yêu cầu giám sát của tôi bị từ chối/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Xóa bộ lọc/ }))
    expect(screen.getByText('Câu hỏi thường gặp')).toBeInTheDocument()
  })

  it('records FAQ feedback with the Vietnamese question, even in English', async () => {
    act(() => setLanguage('en'))
    render(<HelpCenterHomePage />)
    fireEvent.click(await screen.findByRole('button', { name: /Why is my monitoring request still pending approval\?/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.getByText(/Thanks for your feedback/)).toBeInTheDocument()
    expect(supportApi.recordFaqFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        articleId: 'ord-1',
        articleQuestion: 'Tại sao yêu cầu giám sát của tôi vẫn đang chờ phê duyệt?',
        isHelpful: true,
      }),
    )
  })

  it('uses the BE FAQ list in Vietnamese only', async () => {
    vi.spyOn(supportApi, 'getFaqArticles').mockResolvedValue([
      {
        id: 'x',
        articleId: 'ord-1',
        category: 'ORDERS',
        categoryLabel: 'Đơn hàng',
        question: 'Câu hỏi từ BE?',
        answer: 'Trả lời',
        keywords: [],
      },
    ])
    render(<HelpCenterHomePage />)
    expect(await screen.findByText('Câu hỏi từ BE?')).toBeInTheDocument()
    act(() => setLanguage('en'))
    expect(await screen.findByText('Why is my monitoring request still pending approval?')).toBeInTheDocument()
    expect(screen.queryByText('Câu hỏi từ BE?')).not.toBeInTheDocument()
  })
})
