import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { readinessApi } from '../../api/readinessApi'
import type { OrderReadiness } from '../../types/readiness'
import { OrderReadinessCard } from './OrderReadinessCard'

vi.mock('../../api/readinessApi', () => ({
  readinessApi: { get: vi.fn(), answer: vi.fn() },
}))

const readiness: OrderReadiness = {
  orderId: 'o1',
  canApprove: false,
  recommendation: 'COMPLETE_REVIEW',
  blockingReasons: ['Năng lực thực hiện: manager chưa xác nhận'],
  criteria: [
    {
      code: 'SERVICE_AREA',
      type: 'AUTO',
      title: 'Vùng phục vụ',
      description: 'desc',
      required: true,
      result: 'PASS',
      reason: 'Vị trí nằm trong vùng phục vụ',
      note: null,
      decidedByName: null,
      decidedAt: null,
    },
    {
      code: 'CAPABILITY',
      type: 'MANUAL',
      title: 'Năng lực thực hiện',
      description: 'Công ty đủ thiết bị',
      required: true,
      result: 'PENDING',
      reason: null,
      note: null,
      decidedByName: null,
      decidedAt: null,
    },
  ],
}

function renderCard(editable = true) {
  const query = {
    data: readiness,
    error: undefined,
    loading: false,
    reload: vi.fn(),
  }
  render(<OrderReadinessCard orderId="o1" query={query} editable={editable} />)
  return query
}

describe('OrderReadinessCard', () => {
  beforeEach(() => {
    vi.mocked(readinessApi.answer).mockReset()
    vi.mocked(readinessApi.answer).mockResolvedValue(readiness)
  })

  it('shows the system checks and the criteria the manager must answer', () => {
    renderCard()
    expect(
      screen.getByText('Vị trí nằm trong vùng phục vụ'),
    ).toBeInTheDocument()
    expect(screen.getByText('Năng lực thực hiện')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Còn 1 mục manager cần xác nhận',
    )
  })

  it('saves a passing answer immediately and reloads', async () => {
    const query = renderCard()
    const passButton = screen.getByRole('button', {
      name: 'Đạt',
      pressed: false,
    })
    fireEvent.click(passButton)
    expect(
      screen.getByRole('button', { name: 'Đang lưu…', pressed: true }),
    ).toBeDisabled()
    await waitFor(() =>
      expect(readinessApi.answer).toHaveBeenCalledWith('o1', 'CAPABILITY', {
        result: 'PASS',
        note: null,
      }),
    )
    await waitFor(() => expect(query.reload).toHaveBeenCalled())
  })

  it('requires a reason before saving a failing answer', async () => {
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'Không đạt' }))
    expect(readinessApi.answer).not.toHaveBeenCalled()
    const save = screen.getByRole('button', { name: 'Lưu' })
    expect(save).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Ghi chú: Năng lực thực hiện'), {
      target: { value: 'Không có drone ảnh nhiệt' },
    })
    expect(save).toBeEnabled()
    fireEvent.click(save)
    await waitFor(() =>
      expect(readinessApi.answer).toHaveBeenCalledWith('o1', 'CAPABILITY', {
        result: 'FAIL',
        note: 'Không có drone ảnh nhiệt',
      }),
    )
  })

  it('is read-only once the order is no longer pending', () => {
    renderCard(false)
    expect(screen.getByRole('button', { name: 'Đạt' })).toBeDisabled()
  })
})
