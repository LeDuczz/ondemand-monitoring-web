import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { customerApi } from '../../../api/customerApi'
import { AnalysisPage } from '../AnalysisPage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

describe('AnalysisPage', () => {
  it('renders the Vietnamese title', async () => {
    render(<AnalysisPage orderId="cus-ord-002" />)
    expect(await screen.findByText('Phân tích AI')).toBeInTheDocument()
  })

  it('renders the English title when language is switched', async () => {
    render(<AnalysisPage orderId="cus-ord-002" />)
    await screen.findByText('Phân tích AI')
    act(() => setLanguage('en'))
    expect(await screen.findByText('AI analysis')).toBeInTheDocument()
  })

  it('loads the latest analysis from the BE endpoint and lists findings blockers first', async () => {
    const spy = vi.spyOn(customerApi, 'getLatestAnalysis')
    render(<AnalysisPage orderId="cus-ord-002" />)
    expect(await screen.findByText('Có rủi ro')).toBeInTheDocument()
    expect(spy).toHaveBeenCalledWith('cus-ord-002', expect.any(AbortSignal))
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByText(/Dự báo gió 7,4 m\/s/)).toBeInTheDocument()
    expect(screen.getByText('Ngưỡng MAX_WIND_MS')).toBeInTheDocument()
  })

  it('applies a suggestion through the mock endpoint and marks it as sample data', async () => {
    const apply = vi.spyOn(customerApi, 'applyFindingSuggestion')
    render(<AnalysisPage orderId="cus-ord-002" />)
    await screen.findByText('Có rủi ro')
    expect(screen.getAllByText('Dữ liệu mẫu').length).toBeGreaterThan(0)
    const first = screen.getAllByRole('listitem')[0]
    fireEvent.click(within(first).getByRole('button', { name: 'Áp dụng' }))
    expect(await within(first).findByText('Đã áp dụng gợi ý')).toBeInTheDocument()
    expect(apply).toHaveBeenCalledWith('cus-ord-002', 'finding-002-1')
  })

  it('ignores a suggestion', async () => {
    render(<AnalysisPage orderId="cus-ord-002" />)
    await screen.findByText('Có rủi ro')
    const first = screen.getAllByRole('listitem')[0]
    fireEvent.click(within(first).getByRole('button', { name: 'Bỏ qua' }))
    expect(await within(first).findByText('Đã bỏ qua gợi ý')).toBeInTheDocument()
  })

  it('shows an empty state when the order has no analysis yet', async () => {
    render(<AnalysisPage orderId="cus-ord-003" />)
    expect(await screen.findByText('Chưa có kết quả phân tích')).toBeInTheDocument()
  })

  it('shows an error with retry and recovers', async () => {
    vi.spyOn(customerApi, 'getLatestAnalysis').mockRejectedValueOnce(new Error('boom'))
    render(<AnalysisPage orderId="cus-ord-002" />)
    expect(await screen.findByText('Không tải được kết quả phân tích')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(screen.getByText('Có rủi ro')).toBeInTheDocument())
  })
})
